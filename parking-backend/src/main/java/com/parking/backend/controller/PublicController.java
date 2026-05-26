package com.parking.backend.controller;

import com.parking.backend.model.entity.Slot;
import com.parking.backend.model.entity.VehicleType;
import com.parking.backend.model.entity.Floor;
import com.parking.backend.model.entity.BuildingStructure;
import com.parking.backend.repository.VehicleTypeRepository;
import com.parking.backend.repository.FloorRepository;
import com.parking.backend.repository.BuildingStructureRepository;
import com.parking.backend.service.SlotService;
import com.parking.backend.service.PaymentService;
import com.parking.backend.service.SystemConfigService;
import com.parking.backend.model.dto.SystemConfigDTO;
import com.parking.backend.model.dto.WebhookPayload;
import com.parking.backend.service.IncidentService;
import com.parking.backend.service.CheckOutService;
import com.parking.backend.repository.ParkingSessionRepository;
import com.parking.backend.model.entity.ParkingSession;
import java.util.Map;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/public")
@RequiredArgsConstructor
public class PublicController {

    private final SlotService slotService;
    private final VehicleTypeRepository vehicleTypeRepository;
    private final FloorRepository floorRepository;
    private final BuildingStructureRepository buildingStructureRepository;
    private final SystemConfigService systemConfigService;
    private final PaymentService paymentService;
    private final IncidentService incidentService;
    private final CheckOutService checkOutService;
    private final ParkingSessionRepository sessionRepository;

    

    @GetMapping("/tracking")
    public ResponseEntity<?> getActiveSessionTracking(@RequestParam String plate) {
        try {
            ParkingSession session = checkOutService.findActiveSession(plate, null);
            return ResponseEntity.ok(checkOutService.previewCheckOut(session.getSessionId()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/payments/webhook")
    public ResponseEntity<String> processWebhook(@RequestBody WebhookPayload payload) {
        try {
            paymentService.processWebhook(payload);
            return ResponseEntity.ok("OK");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/incidents/report")
    public ResponseEntity<?> reportPublicIncident(@RequestBody Map<String, String> request) {
        try {
            String plate = request.get("licensePlate");
            String type = request.get("type");
            String description = request.get("description");
            
            // Find active session by plate
            Optional<ParkingSession> sessionOpt = sessionRepository.findByLicensePlateInAndStatus(plate, "Active");
            if (sessionOpt.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("message", "No active session found for this license plate."));
            }
            
            ParkingSession session = sessionOpt.get();
            
            incidentService.reportIncident(session.getSessionId(), type, description, "USER_KIOSK");
            return ResponseEntity.ok(Map.of("message", "Incident reported successfully. Staff has been notified."));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/slots")
    public ResponseEntity<List<Slot>> getAllSlots() {
        return ResponseEntity.ok(slotService.getAllSlots());
    }

    

    @GetMapping("/vehicle-types")
    public ResponseEntity<List<VehicleType>> getVehicleTypes() {
        return ResponseEntity.ok(vehicleTypeRepository.findAll());
    }

    @GetMapping("/floors")
    public ResponseEntity<List<Floor>> getFloors() {
        return ResponseEntity.ok(floorRepository.findAll());
    }

    @GetMapping("/structures")
    public ResponseEntity<List<BuildingStructure>> getStructures() {
        return ResponseEntity.ok(buildingStructureRepository.findAll());
    }
}



