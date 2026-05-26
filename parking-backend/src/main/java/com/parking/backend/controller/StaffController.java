package com.parking.backend.controller;

import com.parking.backend.model.dto.CheckInCheckResponse;
import com.parking.backend.model.dto.CheckInRequest;
import com.parking.backend.model.dto.CheckOutRequest;
import com.parking.backend.model.dto.CheckOutResponse;
import com.parking.backend.model.entity.ExceptionLog;
import com.parking.backend.model.entity.ParkingSession;
import com.parking.backend.repository.AccountRepository;
import com.parking.backend.repository.ExceptionLogRepository;
import com.parking.backend.repository.ParkingSessionRepository;
import com.parking.backend.service.CheckInService;
import com.parking.backend.service.CheckOutService;
import com.parking.backend.service.IncidentService;
import com.parking.backend.model.dto.IncidentRequest;
import com.parking.backend.model.dto.IncidentResponseDTO;
import com.parking.backend.model.entity.Floor;
import com.parking.backend.model.entity.Slot;
import com.parking.backend.model.entity.BuildingStructure;
import com.parking.backend.model.entity.Booking;
import com.parking.backend.repository.FloorRepository;
import com.parking.backend.repository.BuildingStructureRepository;
import com.parking.backend.service.SlotService;
import com.parking.backend.service.BookingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/staff")
@PreAuthorize("hasAnyRole('STAFF', 'MANAGER', 'ADMIN')")
@RequiredArgsConstructor
public class StaffController {

    private final CheckInService checkInService;
    private final CheckOutService checkOutService;
    private final ParkingSessionRepository sessionRepository;
    private final ExceptionLogRepository exceptionLogRepository;
    private final AccountRepository accountRepository;
    private final IncidentService incidentService;
    private final FloorRepository floorRepository;
    private final SlotService slotService;
    private final BuildingStructureRepository buildingStructureRepository;
    private final BookingService bookingService;

    // ===== MAP DATA =====
    @GetMapping("/floors")
    public ResponseEntity<List<Floor>> getFloors() {
        return ResponseEntity.ok(floorRepository.findAll());
    }

    @GetMapping("/slots")
    public ResponseEntity<List<Slot>> getAllSlots() {
        return ResponseEntity.ok(slotService.getAllSlots());
    }

    @GetMapping("/structures")
    public ResponseEntity<List<BuildingStructure>> getAllStructures() {
        return ResponseEntity.ok(buildingStructureRepository.findAll());
    }

    // ===== BOOKING DATA =====
    @GetMapping("/bookings/{id}")
    public ResponseEntity<Booking> getBookingById(@PathVariable Integer id) {
        return ResponseEntity.ok(bookingService.getBookingById(id));
    }


    // ===== CHECK IN =====

    /** Check entry conditions and suggest slot/zone */
    @GetMapping("/check-in/check")
    public ResponseEntity<CheckInCheckResponse> checkEntry(
            @RequestParam String plate,
            @RequestParam Integer typeId) {
        return ResponseEntity.ok(checkInService.checkEntryCondition(plate, typeId));
    }

    /** Confirm vehicle entry - create session */
    @PostMapping("/check-in")
    public ResponseEntity<ParkingSession> confirmCheckIn(@Valid @RequestBody CheckInRequest request) {
        return ResponseEntity.ok(checkInService.confirmCheckIn(request));
    }

    /** Cancel session (vehicle did not enter) */
    @DeleteMapping("/check-in/{sessionId}")
    public ResponseEntity<Map<String, String>> cancelSession(@PathVariable Integer sessionId) {
        checkInService.cancelSession(sessionId);
        return ResponseEntity.ok(Map.of("message", "Cancelled parking session #" + sessionId));
    }

    // ===== CHECK OUT =====

    /** Find active session by license plate */
    @GetMapping("/check-out/find")
    public ResponseEntity<CheckOutResponse> findSessionForCheckOut(
            @RequestParam(required = false) String plate,
            @RequestParam(required = false) String cardCode) {
        ParkingSession session = checkOutService.findActiveSession(plate, cardCode);
        return ResponseEntity.ok(checkOutService.previewCheckOut(session.getSessionId()));
    }

    @GetMapping("/check-out/find-by-slot")
    public ResponseEntity<CheckOutResponse> findSessionBySlotForCheckOut(@RequestParam Integer slotId) {
        ParkingSession session = checkOutService.findActiveSessionBySlot(slotId);
        return ResponseEntity.ok(checkOutService.previewCheckOut(session.getSessionId()));
    }

    /** Preview estimated fee before confirmation */
    @GetMapping("/check-out/{sessionId}/preview")
    public ResponseEntity<CheckOutResponse> previewCheckOut(@PathVariable Integer sessionId) {
        return ResponseEntity.ok(checkOutService.previewCheckOut(sessionId));
    }

    /** Confirm vehicle exit - collect fee */
    @PostMapping("/check-out/{sessionId}")
    public ResponseEntity<CheckOutResponse> confirmCheckOut(
            @PathVariable Integer sessionId,
            @Valid @RequestBody CheckOutRequest request) {
        return ResponseEntity.ok(checkOutService.confirmCheckOut(sessionId, request));
    }

    // ===== EXCEPTION HANDLING =====

    /** Get list of exceptions (filter by status) */
    @GetMapping("/exceptions")
    public ResponseEntity<List<ExceptionLog>> getExceptions(
            @RequestParam(required = false) String status) {
        if (status != null) {
            return ResponseEntity.ok(exceptionLogRepository.findByStatus(status));
        }
        return ResponseEntity.ok(exceptionLogRepository.findAll());
    }

    /** Record a new exception */
    @PostMapping("/exceptions")
    public ResponseEntity<IncidentResponseDTO> createException(
            @Valid @RequestBody IncidentRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {

        var staffAccount = accountRepository.findByUsername(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("Staff account not found"));

        return ResponseEntity.ok(incidentService.createIncident(request, staffAccount.getAccountId()));
    }

    /** Update exception resolution status */
    @PutMapping("/exceptions/{id}")
    public ResponseEntity<ExceptionLog> resolveException(
            @PathVariable Integer id,
            @RequestBody Map<String, String> body) {

        ExceptionLog log = exceptionLogRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Exception log not found"));

        String newStatus = body.get("status"); // Resolved, Rejected
        String note = body.get("resolutionNote");

        log.setStatus(newStatus);
        log.setResolutionNote(note);
        log.setResolvedAt(LocalDateTime.now());

        return ResponseEntity.ok(exceptionLogRepository.save(log));
    }
}
