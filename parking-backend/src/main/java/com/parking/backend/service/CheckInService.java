package com.parking.backend.service;

import com.parking.backend.model.dto.CheckInCheckResponse;
import com.parking.backend.model.dto.CheckInRequest;
import com.parking.backend.model.entity.*;
import com.parking.backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CheckInService {

    private final ParkingSessionRepository sessionRepository;
    private final SlotRepository slotRepository;
    private final FloorRepository floorRepository;
    private final VehicleTypeRepository vehicleTypeRepository;
    private final BookingRepository bookingRepository;
    private final NotificationService notificationService;
    private final TimeService timeService;
    private final FloorVehicleAllocationRepository floorAllocationRepository;
    private final GateRepository gateRepository;
    private final ParkingCardRepository parkingCardRepository;
    private final BlacklistRepository blacklistRepository;
    private final AccountRepository accountRepository;

    /**
     * Check entry conditions and suggest a suitable slot/zone.
     * Logic: Monthly pass -> Monthly zone | Booked -> Reserved slot | Transient -> Transient zone
     */
    public CheckInCheckResponse checkEntryCondition(String licensePlate, Integer typeId) {
        VehicleType vehicleType = vehicleTypeRepository.findById(typeId)
                .orElseThrow(() -> new RuntimeException("Vehicle type not found: " + typeId));

        if (!"Active".equalsIgnoreCase(vehicleType.getStatus())) {
            return CheckInCheckResponse.builder()
                    .canEnter(false)
                    .message("Vehicle type '" + vehicleType.getTypeName() + "' is not allowed to enter.")
                    .build();
        }

        // Check if the vehicle is already in the parking lot
        sessionRepository.findByLicensePlateInAndStatus(licensePlate, "Active").ifPresent(s -> {
            throw new RuntimeException("Vehicle " + licensePlate + " already has an active session (Session #" + s.getSessionId() + ")");
        });

        // Check for pending bookings
        List<Booking> activeBookings = bookingRepository.findByLicensePlateAndStatusIn(
                licensePlate, List.of("Confirmed", "PENDING"));

        for (Booking booking : activeBookings) {
            if (booking.getVehicleType().getTypeId().equals(typeId)) {
                // Customer has a booking.
                // If they have a specific slot booked
                if (booking.getSlot() != null) {
                    return CheckInCheckResponse.builder()
                            .canEnter(true)
                            .entryType("BOOKING")
                            .message("Booked customer. Directing to reserved slot.")
                            .suggestedFloorId(booking.getFloor().getFloorId())
                            .suggestedFloorName(booking.getFloor().getFloorName())
                            .suggestedSlotId(booking.getSlot().getSlotId())
                            .suggestedSlotName(booking.getSlot().getSlotName())
                            .bookingId(booking.getBookingId())
                            .build();
                } else {
                    // Flexible routing: find any available slot on the booked floor that allows pre-booking
                    List<Slot> availableSlots = slotRepository.findByFloor_FloorIdAndStatus(booking.getFloor().getFloorId(), "Available").stream()
                            .filter(s -> Boolean.TRUE.equals(s.getAllowPreBooking()))
                            .filter(s -> s.getVehicleType() != null && s.getVehicleType().getTypeId().equals(typeId))
                            .toList();
                    if (!availableSlots.isEmpty()) {
                        Slot suggested = availableSlots.get(0);
                        return CheckInCheckResponse.builder()
                                .canEnter(true)
                                .entryType("BOOKING")
                                .message("Booked customer. Directing to available pre-booking slot on booked floor.")
                                .suggestedFloorId(booking.getFloor().getFloorId())
                                .suggestedFloorName(booking.getFloor().getFloorName())
                                .suggestedSlotId(suggested.getSlotId())
                                .suggestedSlotName(suggested.getSlotName())
                                .bookingId(booking.getBookingId())
                                .build();
                    }
                }
            }
        }

        // Apply Floor Allocation Filter and Sort by Priority
        List<FloorVehicleAllocation> floorAllocations = floorAllocationRepository.findByVehicleType_TypeIdAndIsActiveTrueOrderByPriorityIndexAsc(typeId);
        List<Integer> allowedFloorIdsInOrder = floorAllocations.stream().map(a -> a.getFloor().getFloorId()).toList();

        if (allowedFloorIdsInOrder.isEmpty()) {
            return CheckInCheckResponse.builder()
                    .canEnter(false)
                    .message("No floor allocation configured for this vehicle type.")
                    .build();
        }

        // Search for an available slot in the allocated floors
        for (Integer floorId : allowedFloorIdsInOrder) {
            List<Slot> availableSlots = slotRepository.findByFloor_FloorIdAndStatus(floorId, "Available").stream()
                    .filter(s -> !Boolean.TRUE.equals(s.getAllowPreBooking())) // Transient prefers non-prebooking slots first
                    .filter(s -> s.getVehicleType() != null && s.getVehicleType().getTypeId().equals(typeId))
                    .toList();
            
            if (!availableSlots.isEmpty()) {
                Slot suggested = availableSlots.get(0);
                return CheckInCheckResponse.builder()
                        .canEnter(true)
                        .entryType("TRANSIENT")
                        .message(availableSlots.size() + " available slots. Directing vehicle to floor " + suggested.getFloor().getFloorName())
                        .suggestedFloorId(floorId)
                        .suggestedFloorName(suggested.getFloor().getFloorName())
                        .suggestedSlotId(suggested.getSlotId())
                        .suggestedSlotName(suggested.getSlotName())
                        .availableSlots((long) availableSlots.size())
                        .build();
            }
        }
        
        // Fallback: If no non-prebooking slots available, search ANY available slot (even if allowPreBooking=true)
        for (Integer floorId : allowedFloorIdsInOrder) {
            List<Slot> availableSlots = slotRepository.findByFloor_FloorIdAndStatus(floorId, "Available").stream()
                    .filter(s -> s.getVehicleType() != null && s.getVehicleType().getTypeId().equals(typeId))
                    .toList();
            
            if (!availableSlots.isEmpty()) {
                Slot suggested = availableSlots.get(0);
                return CheckInCheckResponse.builder()
                        .canEnter(true)
                        .entryType("TRANSIENT (FALLBACK)")
                        .message(availableSlots.size() + " available slots. Directing vehicle to floor " + suggested.getFloor().getFloorName())
                        .suggestedFloorId(floorId)
                        .suggestedFloorName(suggested.getFloor().getFloorName())
                        .suggestedSlotId(suggested.getSlotId())
                        .suggestedSlotName(suggested.getSlotName())
                        .availableSlots((long) availableSlots.size())
                        .build();
            }
        }

        return CheckInCheckResponse.builder()
                .canEnter(false)
                .message("Parking lot is full for this vehicle type. Please return later.")
                .build();
    }

    /**
     * Confirm creating Parking Session (vehicle has entered).
     */
    @Transactional(isolation = org.springframework.transaction.annotation.Isolation.READ_COMMITTED, rollbackFor = Exception.class)
    public ParkingSession confirmCheckIn(CheckInRequest request) {
        // 1. Check Blacklist
        if (blacklistRepository.existsByLicensePlate(request.getLicensePlate())) {
            throw new RuntimeException("Vehicle license plate is blacklisted. Entry denied.");
        }

        // 2. Validate Card
        ParkingCard card = parkingCardRepository.findByCardCodeAndStatus(request.getCardCode(), "AVAILABLE")
                .orElseGet(() -> {
                    // For mock purposes: auto-generate card in DB if it starts with CARD-
                    if (request.getCardCode() != null && request.getCardCode().startsWith("CARD-")) {
                        ParkingCard newCard = ParkingCard.builder()
                                .cardCode(request.getCardCode())
                                .status("AVAILABLE")
                                .build();
                        return parkingCardRepository.save(newCard);
                    }
                    throw new RuntimeException("Card is invalid or already in use. Please scan another card.");
                });

        // 3. Fetch dependencies
        Gate gate = null;
        if (request.getGateId() != null) {
            gate = gateRepository.findById(request.getGateId())
                    .orElseThrow(() -> new RuntimeException("Gate not found"));
        }

        Account staff = null;
        if (request.getStaffId() != null) {
            staff = accountRepository.findById(request.getStaffId())
                    .orElseThrow(() -> new RuntimeException("Staff not found"));
        }

        Slot slot = slotRepository.findById(request.getSlotId())
                .orElseThrow(() -> new RuntimeException("Slot not found"));

        if (!"Available".equalsIgnoreCase(slot.getStatus())) {
            throw new RuntimeException("Slot " + slot.getSlotName() + " is no longer available");
        }

        VehicleType type = vehicleTypeRepository.findById(request.getTypeId())
                .orElseThrow(() -> new RuntimeException("Vehicle type not found"));

        // Update slot status -> Occupied
        slot.setStatus("Occupied");
        slotRepository.save(slot);

        // If booking exists, update status -> CHECKED_IN
        if (request.getBookingId() != null) {
            bookingRepository.findById(request.getBookingId()).ifPresent(b -> {
                b.setStatus("CHECKED_IN");
                bookingRepository.save(b);
            });
        }

        // Update card status -> IN_USE
        card.setStatus("IN_USE");
        parkingCardRepository.save(card);

        // Create a new session
        ParkingSession session = ParkingSession.builder()
                .cardCode(card.getCardCode())
                .parkingCard(card)
                .entryGate(gate)
                .checkInStaff(staff)
                .licensePlateIn(request.getLicensePlate())
                .vehicleType(type)
                .slot(slot)
                .timeIn(timeService.now())
                .status("Active")
                .build();

        ParkingSession savedSession = sessionRepository.save(session);
        notificationService.broadcast("SLOTS_UPDATED", "Slot occupied via Check-In");
        
        // Push notification to user's mobile app if applicable
        notificationService.broadcast("PUSH_NOTIFICATION", 
            "Xe mang biển số " + request.getLicensePlate() + " đã vào bãi lúc " + session.getTimeIn());
            
        return savedSession;
    }

    /**
     * Cancel parking session (in case the vehicle doesn't enter).
     */
    @Transactional
    public void cancelSession(Integer sessionId) {
        ParkingSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Session not found"));

        if (!"Active".equalsIgnoreCase(session.getStatus())) {
            throw new RuntimeException("Only active sessions can be cancelled");
        }

        // Return slot to Available
        Slot slot = session.getSlot();
        if (slot != null) {
            slot.setStatus("Available");
            slotRepository.save(slot);
        }

        session.setStatus("Cancelled");
        session.setTimeOut(LocalDateTime.now());
        sessionRepository.save(session);
        notificationService.broadcast("SLOTS_UPDATED", "Slot freed via Session Cancel");
    }
}
