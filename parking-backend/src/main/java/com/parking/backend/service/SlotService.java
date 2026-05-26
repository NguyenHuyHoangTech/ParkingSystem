package com.parking.backend.service;

import com.parking.backend.model.entity.Slot;
import com.parking.backend.repository.SlotRepository;
import com.parking.backend.repository.VehicleTypeRepository;
import com.parking.backend.repository.FloorRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.time.LocalDateTime;
import java.util.Optional;

import com.parking.backend.model.dto.SlotUpdateDTO;
import com.parking.backend.model.entity.SlotStatusHistory;
import com.parking.backend.model.entity.Account;
import com.parking.backend.model.entity.Booking;
import com.parking.backend.model.entity.VehicleType;
import com.parking.backend.model.entity.ParkingZone;
import com.parking.backend.repository.AccountRepository;
import com.parking.backend.repository.BookingRepository;
import com.parking.backend.repository.SlotStatusHistoryRepository;
import com.parking.backend.repository.ParkingZoneRepository;
import com.parking.backend.exception.SlotStatusConflictException;
@Service
@RequiredArgsConstructor
public class SlotService {

    private final SlotRepository slotRepository;
    private final FloorRepository floorRepository;
    private final VehicleTypeRepository vehicleTypeRepository;
    private final NotificationService notificationService;
    private final BookingRepository bookingRepository;
    private final SlotStatusHistoryRepository slotStatusHistoryRepository;
    private final AccountRepository accountRepository;
    private final ParkingZoneRepository parkingZoneRepository;

    public List<Slot> getSlotsByFloor(Integer floorId) {
        return slotRepository.findByFloor_FloorId(floorId);
    }

    public List<Slot> getAllSlots() {
        return slotRepository.findAll();
    }

    @Transactional
    public Slot addSlot(Integer floorId, String slotName, Integer posX, Integer posY, Integer typeId, Boolean allowPreBooking) {
        var floor = floorRepository.findById(floorId)
                .orElseThrow(() -> new RuntimeException("Floor not found: " + floorId));
        
        validateSlotWithZones(floorId, posX, posY, typeId);
        
        var vehicleType = typeId != null ? vehicleTypeRepository.findById(typeId)
                .orElseThrow(() -> new RuntimeException("VehicleType not found: " + typeId)) : null;

        Slot slot = Slot.builder()
                .floor(floor)
                .vehicleType(vehicleType)
                .slotName(slotName)
                .posX(posX)
                .posY(posY)
                .status("Available")
                .allowPreBooking(allowPreBooking != null ? allowPreBooking : false)
                .build();
        Slot savedSlot = slotRepository.save(slot);
        notificationService.broadcast("SLOTS_UPDATED", "Slot added");
        return savedSlot;
    }

    @Transactional
    public Slot updateSlotStatus(Integer slotId, String newStatus) {
        List<String> allowed = List.of("Available", "Occupied", "Booked", "Maintenance", "Locked");
        if (!allowed.contains(newStatus)) {
            throw new RuntimeException("Invalid status: " + newStatus);
        }
        Slot slot = slotRepository.findById(slotId)
                .orElseThrow(() -> new RuntimeException("Slot not found: " + slotId));
        slot.setStatus(newStatus);
        Slot savedSlot = slotRepository.save(slot);
        notificationService.broadcast("SLOTS_UPDATED", "Slot status changed");
        return savedSlot;
    }

    @Transactional(rollbackFor = Exception.class)
    public Slot updateSlotStatusManager(Integer slotId, SlotUpdateDTO request, String managerUsername) {
        List<String> allowed = List.of("Available", "Maintenance", "Locked");
        if (!allowed.contains(request.getStatus())) {
            throw new RuntimeException("Invalid status for manager: " + request.getStatus());
        }

        Slot slot = slotRepository.findByIdWithPessimisticLock(slotId)
                .orElseThrow(() -> new RuntimeException("Slot not found: " + slotId));

        String oldStatus = slot.getStatus();

        if ("Occupied".equalsIgnoreCase(oldStatus) && !request.getStatus().equalsIgnoreCase("Available")) {
            throw new SlotStatusConflictException("Cannot change status of an occupied slot.");
        }

        if ("Booked".equalsIgnoreCase(oldStatus) && !request.getStatus().equalsIgnoreCase("Available")) {
            if (Boolean.TRUE.equals(request.getAutoReallocate())) {
                List<Slot> substitutes = slotRepository.findAvailableSlotByTypePreferredFloor(
                        slot.getVehicleType().getTypeId(), slot.getFloor().getFloorId());
                if (substitutes.isEmpty()) {
                    throw new SlotStatusConflictException("Cannot lock. The parking lot has no equivalent available slots to reallocate the current Booking.");
                }
                Slot substituteSlot = substitutes.get(0);
                
                // Find the active booking for this slot
                List<Booking> activeBookings = bookingRepository.findBySlot_SlotIdAndStatusIn(
                        slotId, List.of("Pending", "Confirmed"));
                if (!activeBookings.isEmpty()) {
                    Booking activeBooking = activeBookings.get(0);
                    activeBooking.setSlot(substituteSlot);
                    substituteSlot.setStatus("Booked");
                    slotRepository.save(substituteSlot);
                    bookingRepository.save(activeBooking);
                    // Notify user (mock)
                    notificationService.broadcast("USER_NOTIFICATION", 
                            "Your parking position has been changed to " + substituteSlot.getSlotName() + " due to maintenance.");
                }
            } else {
                throw new SlotStatusConflictException("Slot is booked. You must enable autoReallocate to lock this slot.");
            }
        }

        slot.setStatus(request.getStatus());
        Slot savedSlot = slotRepository.save(slot);

        Account manager = accountRepository.findByUsername(managerUsername)
                .orElseThrow(() -> new RuntimeException("Manager not found: " + managerUsername));

        SlotStatusHistory history = SlotStatusHistory.builder()
                .slot(savedSlot)
                .oldStatus(oldStatus)
                .newStatus(request.getStatus())
                .changedBy(manager)
                .reason(request.getReason())
                .createdAt(LocalDateTime.now())
                .build();
        slotStatusHistoryRepository.save(history);

        notificationService.broadcast("SLOTS_UPDATED", "Slot " + slot.getSlotName() + " status changed to " + request.getStatus());
        return savedSlot;
    }

    @Transactional
    public void deleteSlot(Integer slotId) {
        Slot slot = slotRepository.findById(slotId)
                .orElseThrow(() -> new RuntimeException("Slot not found: " + slotId));
        if ("Occupied".equalsIgnoreCase(slot.getStatus())) {
            throw new RuntimeException("Cannot delete an occupied slot");
        }
        slotRepository.delete(slot);
        notificationService.broadcast("SLOTS_UPDATED", "Slot deleted");
    }

    @Transactional
    public Slot updateSlotPosition(Integer slotId, Integer posX, Integer posY) {
        Slot slot = slotRepository.findById(slotId)
                .orElseThrow(() -> new RuntimeException("Slot not found: " + slotId));
        
        Integer typeId = slot.getVehicleType() != null ? slot.getVehicleType().getTypeId() : null;
        validateSlotWithZones(slot.getFloor().getFloorId(), posX, posY, typeId);
        
        slot.setPosX(posX);
        slot.setPosY(posY);
        Slot savedSlot = slotRepository.save(slot);
        notificationService.broadcast("SLOTS_UPDATED", "Slot position updated");
        return savedSlot;
    }

    @Transactional
    public Slot updateSlotProperties(Integer slotId, String slotName, Integer typeId, Boolean allowPreBooking) {
        Slot slot = slotRepository.findById(slotId)
                .orElseThrow(() -> new RuntimeException("Slot not found: " + slotId));
        
        Integer finalTypeId = typeId != null ? typeId : (slot.getVehicleType() != null ? slot.getVehicleType().getTypeId() : null);
        validateSlotWithZones(slot.getFloor().getFloorId(), slot.getPosX(), slot.getPosY(), finalTypeId);
        
        slot.setSlotName(slotName);
        if (typeId != null) {
            var vehicleType = vehicleTypeRepository.findById(typeId).orElseThrow(() -> new RuntimeException("VehicleType not found: " + typeId));
            slot.setVehicleType(vehicleType);
        }
        if (allowPreBooking != null) slot.setAllowPreBooking(allowPreBooking);
        Slot saved = slotRepository.save(slot);
        notificationService.broadcast("SLOTS_UPDATED", "Slot properties updated");
        return saved;
    }

    private void validateSlotWithZones(Integer floorId, Integer posX, Integer posY, Integer typeId) {
        if (typeId == null) return;
        List<ParkingZone> zones = parkingZoneRepository.findByFloor_FloorId(floorId);
        VehicleType vtype = vehicleTypeRepository.findById(typeId)
                .orElseThrow(() -> new RuntimeException("VehicleType not found: " + typeId));
        int slotWidth = vtype.getGridWidth() != null ? vtype.getGridWidth() : 1;
        int slotHeight = vtype.getGridHeight() != null ? vtype.getGridHeight() : 1;

        for (ParkingZone zone : zones) {
            int zoneWidth = zone.getWidth() != null ? zone.getWidth() : 1;
            int zoneHeight = zone.getHeight() != null ? zone.getHeight() : 1;
            
            // Check bounding box overlap
            boolean overlap = (posX < zone.getPosX() + zoneWidth) &&
                              (posX + slotWidth > zone.getPosX()) &&
                              (posY < zone.getPosY() + zoneHeight) &&
                              (posY + slotHeight > zone.getPosY());
            
            if (overlap) {
                // Check if slot's vehicle type is allowed in this zone
                boolean allowed = zone.getAllowedVehicleTypes() != null && zone.getAllowedVehicleTypes().stream()
                        .anyMatch(t -> t.getTypeId().equals(typeId));
                if (!allowed) {
                    throw new RuntimeException("Loại xe '" + vtype.getTypeName() + "' không được phép đỗ trong khu vực: " + zone.getName());
                }
            }
        }
    }
}
