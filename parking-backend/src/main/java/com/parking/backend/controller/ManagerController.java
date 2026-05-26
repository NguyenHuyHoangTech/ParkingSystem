package com.parking.backend.controller;

import com.parking.backend.model.entity.*;
import com.parking.backend.repository.*;
import com.parking.backend.service.NotificationService;
import com.parking.backend.service.SlotService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.security.Principal;
import jakarta.validation.Valid;
import com.parking.backend.model.dto.SlotUpdateDTO;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/manager")
@PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
@RequiredArgsConstructor
public class ManagerController {

    private final FloorRepository floorRepository;
    private final VehicleTypeRepository vehicleTypeRepository;
    private final SlotService slotService;
    private final BuildingStructureRepository buildingStructureRepository;
    private final PenaltyRuleRepository penaltyRuleRepository;
    private final ParkingSessionRepository sessionRepository;
    private final ExceptionLogRepository exceptionLogRepository;
    private final NotificationService notificationService;
    private final ParkingZoneRepository parkingZoneRepository;

    // ===== FLOOR MANAGEMENT =====

    @GetMapping("/floors")
    public ResponseEntity<List<Floor>> getFloors() {
        return ResponseEntity.ok(floorRepository.findAll());
    }

    @PostMapping("/floors")
    public ResponseEntity<Floor> createFloor(@RequestBody Floor floor) {
        if (floor.getStatus() == null) floor.setStatus("Active");
        if (floor.getMapCols() == null) floor.setMapCols(15);
        if (floor.getMapRows() == null) floor.setMapRows(10);
        return ResponseEntity.ok(floorRepository.save(floor));
    }

    @PutMapping("/floors/{floorId}")
    public ResponseEntity<Floor> updateFloor(@PathVariable Integer floorId, @RequestBody Floor details) {
        Floor floor = floorRepository.findById(floorId)
                .orElseThrow(() -> new RuntimeException("Floor not found"));
        floor.setFloorName(details.getFloorName());
        floor.setMapCols(details.getMapCols());
        floor.setMapRows(details.getMapRows());
        floor.setStatus(details.getStatus());
        return ResponseEntity.ok(floorRepository.save(floor));
    }



    @DeleteMapping("/floors/{floorId}")
    public ResponseEntity<Map<String, String>> deleteFloor(@PathVariable Integer floorId) {
        floorRepository.deleteById(floorId);
        return ResponseEntity.ok(Map.of("message", "Floor deleted successfully."));
    }

    // ===== VEHICLE TYPE MANAGEMENT =====

    @GetMapping("/vehicle-types")
    public ResponseEntity<List<VehicleType>> getVehicleTypes() {
        return ResponseEntity.ok(vehicleTypeRepository.findAll());
    }

    @PostMapping("/vehicle-types")
    public ResponseEntity<VehicleType> createVehicleType(@RequestBody VehicleType type) {
        if (type.getStatus() == null) type.setStatus("Active");
        if (type.getGridWidth() == null) type.setGridWidth(1);
        if (type.getGridHeight() == null) type.setGridHeight(1);
        return ResponseEntity.ok(vehicleTypeRepository.save(type));
    }

    @PutMapping("/vehicle-types/{typeId}")
    public ResponseEntity<VehicleType> updateVehicleType(@PathVariable Integer typeId, @RequestBody VehicleType details) {
        VehicleType type = vehicleTypeRepository.findById(typeId)
                .orElseThrow(() -> new RuntimeException("VehicleType not found"));
        type.setTypeName(details.getTypeName());
        type.setSizeMultiplier(details.getSizeMultiplier());
        type.setStatus(details.getStatus());
        type.setGridWidth(details.getGridWidth());
        type.setGridHeight(details.getGridHeight());
        return ResponseEntity.ok(vehicleTypeRepository.save(type));
    }

    @DeleteMapping("/vehicle-types/{typeId}")
    public ResponseEntity<Map<String, String>> disableVehicleType(@PathVariable Integer typeId) {
        VehicleType type = vehicleTypeRepository.findById(typeId)
                .orElseThrow(() -> new RuntimeException("VehicleType not found"));
        type.setStatus("Inactive");
        vehicleTypeRepository.save(type);
        return ResponseEntity.ok(Map.of("message", "Vehicle type disabled successfully."));
    }



    // ===== SLOT AND STATUS MANAGEMENT =====

    @GetMapping("/slots")
    public ResponseEntity<List<Slot>> getAllSlots() {
        return ResponseEntity.ok(slotService.getAllSlots());
    }

    @PostMapping("/slots")
    public ResponseEntity<Slot> addSlot(
            @RequestParam Integer floorId,
            @RequestParam String slotName,
            @RequestParam Integer posX,
            @RequestParam Integer posY,
            @RequestParam(required = false) Integer typeId,
            @RequestParam(required = false, defaultValue = "false") Boolean allowPreBooking) {
        return ResponseEntity.ok(slotService.addSlot(floorId, slotName, posX, posY, typeId, allowPreBooking));
    }

    @PutMapping("/slots/{slotId}/status")
    public ResponseEntity<Slot> updateSlotStatus(
            @PathVariable Integer slotId,
            @RequestParam String status) {
        return ResponseEntity.ok(slotService.updateSlotStatus(slotId, status));
    }

    @PatchMapping("/slots/{slotId}/status")
    public ResponseEntity<Slot> updateSlotStatusManager(
            @PathVariable Integer slotId,
            @Valid @RequestBody SlotUpdateDTO request,
            Principal principal) {
        return ResponseEntity.ok(slotService.updateSlotStatusManager(slotId, request, principal.getName()));
    }

    @DeleteMapping("/slots/{slotId}")
    public ResponseEntity<Map<String, String>> deleteSlot(@PathVariable Integer slotId) {
        slotService.deleteSlot(slotId);
        return ResponseEntity.ok(Map.of("message", "Slot deleted successfully."));
    }

    @PutMapping("/slots/{slotId}/position")
    public ResponseEntity<Slot> updateSlotPosition(
            @PathVariable Integer slotId,
            @RequestParam Integer posX,
            @RequestParam Integer posY) {
        return ResponseEntity.ok(slotService.updateSlotPosition(slotId, posX, posY));
    }

    @PutMapping("/slots/{slotId}/properties")
    public ResponseEntity<Slot> updateSlotProperties(
            @PathVariable Integer slotId,
            @RequestParam String slotName,
            @RequestParam(required = false) Integer typeId,
            @RequestParam(required = false) Boolean allowPreBooking) {
        return ResponseEntity.ok(slotService.updateSlotProperties(slotId, slotName, typeId, allowPreBooking));
    }

    // ===== PENALTY RULES =====

    @GetMapping("/penalty-rules")
    public ResponseEntity<List<PenaltyRule>> getPenaltyRules() {
        return ResponseEntity.ok(penaltyRuleRepository.findAll());
    }

    @PostMapping("/penalty-rules")
    public ResponseEntity<PenaltyRule> createPenaltyRule(@RequestBody PenaltyRule rule) {
        return ResponseEntity.ok(penaltyRuleRepository.save(rule));
    }

    @PutMapping("/penalty-rules/{ruleId}")
    public ResponseEntity<PenaltyRule> updatePenaltyRule(
            @PathVariable Integer ruleId,
            @RequestBody PenaltyRule details) {
        PenaltyRule rule = penaltyRuleRepository.findById(ruleId)
                .orElseThrow(() -> new RuntimeException("PenaltyRule not found"));
        rule.setRuleType(details.getRuleType());
        rule.setFineAmount(details.getFineAmount());
        rule.setDescription(details.getDescription());
        return ResponseEntity.ok(penaltyRuleRepository.save(rule));
    }

    @DeleteMapping("/penalty-rules/{ruleId}")
    public ResponseEntity<Map<String, String>> deletePenaltyRule(@PathVariable Integer ruleId) {
        penaltyRuleRepository.deleteById(ruleId);
        return ResponseEntity.ok(Map.of("message", "Penalty rule deleted successfully."));
    }

    // ===== EXCEPTION LOGS =====

    @GetMapping("/exceptions")
    public ResponseEntity<List<ExceptionLog>> getAllExceptions(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String type) {
        if (status != null) {
            return ResponseEntity.ok(exceptionLogRepository.findByStatus(status));
        }
        if (type != null) {
            return ResponseEntity.ok(exceptionLogRepository.findByExceptionType(type));
        }
        return ResponseEntity.ok(exceptionLogRepository.findAll());
    }

    @GetMapping("/exceptions/{id}")
    public ResponseEntity<ExceptionLog> getExceptionById(@PathVariable Integer id) {
        ExceptionLog log = exceptionLogRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Exception log not found"));
        return ResponseEntity.ok(log);
    }

    // ===== TRAFFIC & REVENUE REPORTS =====

    @GetMapping("/reports/traffic")
    public ResponseEntity<List<Map<String, Object>>> getTrafficReport(
            @RequestParam String fromDate,
            @RequestParam String toDate) {
        List<Object[]> queryResults = sessionRepository.getTrafficReportByType(
                fromDate + " 00:00:00", toDate + " 23:59:59");
        List<Map<String, Object>> response = new ArrayList<>();

        for (Object[] row : queryResults) {
            Map<String, Object> map = new HashMap<>();
            map.put("vehicleTypeName", row[0]);
            map.put("totalSessions", row[1]);
            map.put("revenue", row[2]);
            response.add(map);
        }
        return ResponseEntity.ok(response);
    }

    // ===== BUILDING STRUCTURES =====

    @GetMapping("/structures")
    public ResponseEntity<List<BuildingStructure>> getAllStructures() {
        return ResponseEntity.ok(buildingStructureRepository.findAll());
    }

    @PostMapping("/structures")
    public ResponseEntity<BuildingStructure> createStructure(@RequestBody BuildingStructure structure) {
        if (structure.getFloor() != null && structure.getFloor().getFloorId() != null) {
            Floor floor = floorRepository.findById(structure.getFloor().getFloorId())
                    .orElseThrow(() -> new RuntimeException("Floor not found"));
            structure.setFloor(floor);
        }
        return ResponseEntity.ok(buildingStructureRepository.save(structure));
    }

    @PutMapping("/structures/{id}/position")
    public ResponseEntity<BuildingStructure> updateStructurePosition(
            @PathVariable Integer id,
            @RequestParam Integer posX,
            @RequestParam Integer posY) {
        BuildingStructure structure = buildingStructureRepository.findById(id).orElseThrow();
        structure.setPosX(posX);
        structure.setPosY(posY);
        return ResponseEntity.ok(buildingStructureRepository.save(structure));
    }

    @PutMapping("/structures/{id}")
    public ResponseEntity<BuildingStructure> updateStructureProperties(
            @PathVariable Integer id,
            @RequestBody BuildingStructure details) {
        BuildingStructure structure = buildingStructureRepository.findById(id).orElseThrow();
        structure.setName(details.getName());
        structure.setType(details.getType());
        structure.setWidth(details.getWidth());
        structure.setHeight(details.getHeight());
        return ResponseEntity.ok(buildingStructureRepository.save(structure));
    }

    @DeleteMapping("/structures/{id}")
    public ResponseEntity<Map<String, String>> deleteStructure(@PathVariable Integer id) {
        buildingStructureRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "Structure deleted"));
    }

    // ===== PARKING ZONES =====

    @GetMapping("/zones")
    public ResponseEntity<List<ParkingZone>> getAllZones(@RequestParam(required = false) Integer floorId) {
        if (floorId != null) {
            return ResponseEntity.ok(parkingZoneRepository.findByFloor_FloorId(floorId));
        }
        return ResponseEntity.ok(parkingZoneRepository.findAll());
    }

    @PostMapping("/zones")
    public ResponseEntity<?> createZone(@RequestBody ParkingZone zone) {
        if (zone.getFloor() != null && zone.getFloor().getFloorId() != null) {
            Floor floor = floorRepository.findById(zone.getFloor().getFloorId())
                    .orElseThrow(() -> new RuntimeException("Floor not found"));
            zone.setFloor(floor);
        }
        validateZoneAllowedTypes(zone);
        ParkingZone saved = parkingZoneRepository.save(zone);
        notificationService.broadcast("SLOTS_UPDATED", "Zone created");
        return ResponseEntity.ok(saved);
    }

    @PutMapping("/zones/{id}")
    public ResponseEntity<?> updateZoneProperties(
            @PathVariable Integer id,
            @RequestBody ParkingZone details) {
        ParkingZone zone = parkingZoneRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Zone not found"));
        zone.setName(details.getName());
        zone.setWidth(details.getWidth());
        zone.setHeight(details.getHeight());
        zone.setAllowedVehicleTypes(details.getAllowedVehicleTypes());
        
        validateZoneAllowedTypes(zone);
        
        ParkingZone saved = parkingZoneRepository.save(zone);
        notificationService.broadcast("SLOTS_UPDATED", "Zone updated");
        return ResponseEntity.ok(saved);
    }

    @PutMapping("/zones/{id}/position")
    public ResponseEntity<?> updateZonePosition(
            @PathVariable Integer id,
            @RequestParam Integer posX,
            @RequestParam Integer posY) {
        ParkingZone zone = parkingZoneRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Zone not found"));
        zone.setPosX(posX);
        zone.setPosY(posY);
        
        validateZoneAllowedTypes(zone);
        
        ParkingZone saved = parkingZoneRepository.save(zone);
        notificationService.broadcast("SLOTS_UPDATED", "Zone position updated");
        return ResponseEntity.ok(saved);
    }

    @DeleteMapping("/zones/{id}")
    public ResponseEntity<Map<String, String>> deleteZone(@PathVariable Integer id) {
        parkingZoneRepository.deleteById(id);
        notificationService.broadcast("SLOTS_UPDATED", "Zone deleted");
        return ResponseEntity.ok(Map.of("message", "Zone deleted successfully"));
    }

    private void validateZoneAllowedTypes(ParkingZone zone) {
        if (zone.getFloor() == null || zone.getFloor().getFloorId() == null) return;
        
        if (zone.getAllowedVehicleTypes() != null) {
            java.util.Set<VehicleType> resolvedTypes = new java.util.HashSet<>();
            for (VehicleType vt : zone.getAllowedVehicleTypes()) {
                if (vt.getTypeId() != null) {
                    vehicleTypeRepository.findById(vt.getTypeId()).ifPresent(resolvedTypes::add);
                }
            }
            zone.setAllowedVehicleTypes(resolvedTypes);
        }

        List<Slot> slots = slotService.getSlotsByFloor(zone.getFloor().getFloorId());
        int zoneWidth = zone.getWidth() != null ? zone.getWidth() : 1;
        int zoneHeight = zone.getHeight() != null ? zone.getHeight() : 1;
        
        for (Slot slot : slots) {
            int slotWidth = slot.getVehicleType() != null && slot.getVehicleType().getGridWidth() != null ? slot.getVehicleType().getGridWidth() : 1;
            int slotHeight = slot.getVehicleType() != null && slot.getVehicleType().getGridHeight() != null ? slot.getVehicleType().getGridHeight() : 1;
            
            boolean overlap = (slot.getPosX() < zone.getPosX() + zoneWidth) &&
                              (slot.getPosX() + slotWidth > zone.getPosX()) &&
                              (slot.getPosY() < zone.getPosY() + zoneHeight) &&
                              (slot.getPosY() + slotHeight > zone.getPosY());
            
            if (overlap) {
                boolean allowed = zone.getAllowedVehicleTypes() != null && zone.getAllowedVehicleTypes().stream()
                        .anyMatch(t -> t.getTypeId().equals(slot.getVehicleType().getTypeId()));
                if (!allowed) {
                    throw new RuntimeException("Không thể lưu phân vùng vì có ô đỗ xe '" + slot.getSlotName() + 
                                               "' thuộc loại xe '" + slot.getVehicleType().getTypeName() + 
                                               "' nằm trong phạm vi nhưng không được phép đỗ ở đây.");
                }
            }
        }
    }
}

