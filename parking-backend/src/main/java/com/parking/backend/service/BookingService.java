package com.parking.backend.service;

import com.parking.backend.model.entity.*;
import com.parking.backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
import com.parking.backend.model.dto.FloorAvailabilityDTO;

@Service
@RequiredArgsConstructor
public class BookingService {

    private final BookingRepository bookingRepository;
    private final SlotRepository slotRepository;
    private final FloorRepository floorRepository;
    private final VehicleTypeRepository vehicleTypeRepository;
    private final AccountRepository accountRepository;
    private final PricingPolicyRepository pricingPolicyRepository;
    private final TimeService timeService;
    private final NotificationService notificationService;
    private final ParkingSessionRepository parkingSessionRepository;
    private final ParkingBuildingRepository parkingBuildingRepository;
    private final BlacklistRepository blacklistRepository;
    private final MonthlyTicketRepository monthlyTicketRepository;

    public List<Booking> getMyBookings(Integer accountId) {
        return bookingRepository.findByAccount_AccountId(accountId);
    }

    public Booking getBookingById(Integer id) {
        return bookingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Booking not found with ID: " + id));
    }

    /**
     * Check Zone Availability for a given time range
     */
    @Transactional(readOnly = true)
    public List<FloorAvailabilityDTO> checkAvailability(Integer buildingId, Integer typeId, LocalDateTime startTime, LocalDateTime endTime) {
        if (startTime.isAfter(endTime) || startTime.isBefore(LocalDateTime.now())) {
            throw new RuntimeException("Invalid booking time");
        }

        ParkingBuilding building = parkingBuildingRepository.findById(buildingId)
                .orElseThrow(() -> new RuntimeException("Building not found"));

        // Get all floors in the building that have pre-bookable slots for this type
        List<Floor> bookingFloors = building.getFloors().stream()
                .filter(f -> f.getSlots().stream().anyMatch(s -> Boolean.TRUE.equals(s.getAllowPreBooking()) && s.getVehicleType().getTypeId().equals(typeId)))
                .collect(Collectors.toList());

        return bookingFloors.stream().map(floor -> {
            int totalCapacity = (int) floor.getSlots().stream()
                    .filter(s -> Boolean.TRUE.equals(s.getAllowPreBooking()) && s.getVehicleType().getTypeId().equals(typeId))
                    .count();

            long activeSessions = parkingSessionRepository.countBySlot_Floor_FloorIdAndStatus(floor.getFloorId(), "Active");
            Integer overlappingBookings = bookingRepository.countOverlappingBookingsInFloor(
                    floor.getFloorId(), List.of("Confirmed", "PENDING", "CHECKED_IN"), startTime, endTime);
            if (overlappingBookings == null) overlappingBookings = 0;

            int availableCapacity = (int) (totalCapacity - activeSessions - overlappingBookings);
            
            long durationMinutes = java.time.Duration.between(startTime, endTime).toMinutes();
            double estimatedFee = calculateFee(typeId, durationMinutes, floor.getFloorId());

            return FloorAvailabilityDTO.builder()
                    .floorId(floor.getFloorId())
                    .floorName(floor.getFloorName())
                    .totalCapacity(totalCapacity)
                    .availableCapacity(Math.max(0, availableCapacity))
                    .estimatedFee(estimatedFee)
                    .build();
        }).collect(Collectors.toList());
    }

    /**
     * Pre-book: find available capacity in Booking zone suitable for vehicle type and time range.
     */
    @Transactional(rollbackFor = Exception.class)
    public Booking createBooking(Integer accountId, Integer typeId, Integer floorId,
                                  String licensePlate, LocalDateTime startTime, LocalDateTime endTime) {
        // Validate
        if (startTime.isAfter(endTime) || startTime.isBefore(LocalDateTime.now())) {
            throw new RuntimeException("Invalid booking time");
        }

        if (blacklistRepository.existsByLicensePlate(licensePlate)) {
            throw new RuntimeException("Vehicle license plate is blacklisted. Booking denied.");
        }

        VehicleType type = vehicleTypeRepository.findById(typeId)
                .orElseThrow(() -> new RuntimeException("Vehicle type not found"));

        Account account = accountRepository.findById(accountId)
                .orElseThrow(() -> new RuntimeException("Account not found"));

        // Lock the Floor
        Floor floor = floorRepository.findById(floorId) // Not pessimistic locking Floor, could use optimistic if needed, or lock slots
                .orElseThrow(() -> new RuntimeException("Floor not found"));

        int totalCapacity = (int) floor.getSlots().stream()
                .filter(s -> Boolean.TRUE.equals(s.getAllowPreBooking()) && s.getVehicleType().getTypeId().equals(typeId))
                .count();

        if (totalCapacity == 0) {
            throw new RuntimeException("This floor does not support pre-booking for this vehicle type");
        }

        // Check Capacity
        long activeSessions = parkingSessionRepository.countBySlot_Floor_FloorIdAndStatus(floor.getFloorId(), "Active");
        Integer overlappingBookings = bookingRepository.countOverlappingBookingsInFloor(
                floor.getFloorId(), List.of("Confirmed", "PENDING", "CHECKED_IN"), startTime, endTime);
        if (overlappingBookings == null) overlappingBookings = 0;

        int availableCapacity = (int) (totalCapacity - activeSessions - overlappingBookings);

        if (availableCapacity <= 0) {
            throw new RuntimeException("This floor is fully booked for the selected time range. Please choose another floor.");
        }

        // Calculate fee
        long durationMinutes = java.time.Duration.between(startTime, endTime).toMinutes();
        double fee = calculateFee(typeId, durationMinutes, floor.getFloorId());

        // Check Monthly Ticket override
        java.util.Optional<MonthlyTicket> monthlyTicketOpt = monthlyTicketRepository.findByLicensePlate(licensePlate);
        if (monthlyTicketOpt.isPresent() && "ACTIVE".equalsIgnoreCase(monthlyTicketOpt.get().getStatus())) {
            MonthlyTicket ticket = monthlyTicketOpt.get();
            if (!startTime.toLocalDate().isBefore(ticket.getStartDate()) && !endTime.toLocalDate().isAfter(ticket.getEndDate())) {
                fee = 0.0;
            }
        }

        Booking booking = Booking.builder()
                .account(account)
                .vehicleType(type)
                .floor(floor)
                // SlotId is intentionally left NULL. "Flexible Routing"
                .licensePlate(licensePlate)
                .startTime(startTime)
                .endTime(endTime)
                .status("PENDING")
                .totalFee(fee)
                .build();

        Booking savedBooking = bookingRepository.save(booking);
        // Note: We don't mark any specific slot as Booked anymore.
        return savedBooking;
    }

    @Transactional
    public Booking confirmPayment(Integer bookingId, String paymentMethod) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));
        
        if (!"PENDING".equalsIgnoreCase(booking.getStatus())) {
            throw new RuntimeException("Booking is not in PENDING state");
        }

        booking.setStatus("Confirmed");
        booking.setPaymentMethod(paymentMethod);
        booking.setQrCodeValue("QR:BOOKING:" + booking.getBookingId() + ":" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        Booking savedBooking = bookingRepository.save(booking);
        notificationService.broadcast("SLOTS_UPDATED", "Zone capacity updated by User Booking (Paid)");
        return savedBooking;
    }

    private double calculateFee(Integer typeId, long durationMinutes, Integer floorId) {
        if (durationMinutes <= 0) return 0.0;
        
        Floor floor = floorRepository.findById(floorId).orElse(null);
        if (floor == null) return 0.0;

        Integer buildingId = floor.getParkingBuilding().getBuildingId();
        LocalDateTime now = timeService.now();
        List<PricingPolicy> activePolicies = pricingPolicyRepository.findOverlappingActivePolicies(buildingId, now, now);
        
        if (activePolicies.isEmpty()) {
            return 0.0; // No active policy, assume free
        }
        
        PricingPolicy policy = activePolicies.get(0);
        VehiclePricingRule rule = policy.getVehicleRules().stream()
                .filter(r -> r.getVehicleType().getTypeId().equals(typeId))
                .findFirst()
                .orElse(null);
                
        if (rule == null || rule.getBlocks().isEmpty()) {
            return 0.0; // No rule for this vehicle
        }

        double totalFee = 0.0;
        long remainingMinutes = durationMinutes;

        PricingBlock block = rule.getBlocks().get(0); 

        // First Block
        long firstBlockMins = block.getFirstBlockDurationMinutes();
        if (remainingMinutes > 0) {
            totalFee += block.getFirstBlockRate();
            remainingMinutes -= Math.min(remainingMinutes, firstBlockMins);
        }

        // Subsequent Blocks
        if (remainingMinutes > 0) {
            long subBlockMins = block.getSubsequentBlockDurationMinutes();
            if (subBlockMins > 0) {
                long blocksUsed = (long) Math.ceil((double) remainingMinutes / subBlockMins);
                totalFee += blocksUsed * block.getSubsequentBlockRate();
            }
        }

        // Apply Max Daily Cap if configured
        if (rule.getMaxDailyCap() != null && rule.getMaxDailyCap() > 0) {
            totalFee = Math.min(totalFee, rule.getMaxDailyCap());
        }

        return totalFee;
    }

    /**
     * Cancel booking - only owner can cancel.
     */
    @Transactional
    public void cancelBooking(Integer bookingId, Integer accountId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));

        if (!booking.getAccount().getAccountId().equals(accountId)) {
            throw new RuntimeException("You do not have permission to cancel this booking");
        }

        if (!"Confirmed".equalsIgnoreCase(booking.getStatus()) && !"Pending".equalsIgnoreCase(booking.getStatus())) {
            throw new RuntimeException("Only Confirmed or Pending bookings can be cancelled");
        }

        booking.setStatus("Cancelled");
        bookingRepository.save(booking);
        notificationService.broadcast("SLOTS_UPDATED", "Zone capacity freed via Booking Cancel");
    }
}


