package com.parking.backend.controller;

import com.parking.backend.model.dto.BuildingDetailsResponse;
import com.parking.backend.model.dto.CheckOutResponse;
import com.parking.backend.model.entity.Booking;
import com.parking.backend.model.entity.ParkingBuilding;
import com.parking.backend.model.entity.ParkingSession;
import com.parking.backend.model.entity.PaymentTransaction;
import com.parking.backend.model.dto.*;
import com.parking.backend.model.entity.*;
import com.parking.backend.repository.AccountRepository;
import com.parking.backend.repository.ParkingSessionRepository;
import com.parking.backend.repository.PricingPolicyRepository;
import com.parking.backend.repository.SlotRepository;
import com.parking.backend.service.BookingService;
import com.parking.backend.service.CheckOutService;
import com.parking.backend.service.PaymentService;
import com.parking.backend.service.FeedbackService;
import com.parking.backend.service.UserFacadeService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/user")
@PreAuthorize("hasAnyRole('USER', 'MANAGER', 'ADMIN')")
@RequiredArgsConstructor
public class UserController {

    private final BookingService bookingService;
    private final UserFacadeService userFacadeService;
    private final ParkingSessionRepository sessionRepository;
    private final PricingPolicyRepository pricingPolicyRepository;
    private final SlotRepository slotRepository;
    private final AccountRepository accountRepository;
    private final CheckOutService checkOutService;
    private final PaymentService paymentService;
    private final FeedbackService feedbackService;

    private Integer getAccountId(UserDetails userDetails) {
        return accountRepository.findByUsername(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User account not found"))
                .getAccountId();
    }

    /** Get parking overview info: prices and available slots */
    @GetMapping("/building-info")
    public ResponseEntity<Map<String, Object>> getBuildingInfo() {
        Map<String, Object> info = new HashMap<>();
        
        // Get all price configs
        List<PricingPolicy> prices = pricingPolicyRepository.findAll();
        info.put("prices", prices);

        // Count total available slots in the parking lot
        long totalAvailable = slotRepository.findByStatus("Available").size();
        info.put("totalAvailableSlots", totalAvailable);

        return ResponseEntity.ok(info);
    }

    // --- Map & Building Details ---

    @GetMapping("/buildings")
    // Note: Public or Guest token can be used if SecurityConfig permits.
    public ResponseEntity<List<ParkingBuilding>> getAllBuildings() {
        return ResponseEntity.ok(userFacadeService.getAllBuildings());
    }

    @GetMapping("/buildings/{buildingId}/details")
    public ResponseEntity<BuildingDetailsResponse> getBuildingDetails(@PathVariable Integer buildingId) {
        return ResponseEntity.ok(userFacadeService.getBuildingDetails(buildingId));
    }

    /** View my booking list */
    @GetMapping("/bookings")
    public ResponseEntity<List<Booking>> getMyBookings(@AuthenticationPrincipal UserDetails userDetails) {
        Integer accountId = getAccountId(userDetails);
        return ResponseEntity.ok(bookingService.getMyBookings(accountId));
    }

    /** Check Availability */
    @GetMapping("/buildings/{buildingId}/availability")
    public ResponseEntity<List<com.parking.backend.model.dto.FloorAvailabilityDTO>> checkAvailability(
            @PathVariable Integer buildingId,
            @RequestParam Integer typeId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startTime,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endTime) {
        return ResponseEntity.ok(bookingService.checkAvailability(buildingId, typeId, startTime, endTime));
    }

    /** Create a new booking */
    @PostMapping("/bookings")
    public ResponseEntity<Booking> createBooking(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam Integer typeId,
            @RequestParam Integer floorId,
            @RequestParam String licensePlate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startTime,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endTime) {
        
        Integer accountId = getAccountId(userDetails);
        return ResponseEntity.ok(bookingService.createBooking(
                accountId, typeId, floorId, licensePlate, startTime, endTime
        ));
    }

    /** Confirm booking payment */
    @PostMapping("/bookings/{bookingId}/confirm-payment")
    public ResponseEntity<Booking> confirmPayment(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Integer bookingId,
            @RequestParam String paymentMethod) {
        
        // Ensure user owns booking (can add check inside service or here)
        return ResponseEntity.ok(bookingService.confirmPayment(bookingId, paymentMethod));
    }

    /** Cancel a booking */
    @DeleteMapping("/bookings/{bookingId}")
    public ResponseEntity<String> cancelBooking(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Integer bookingId) {
        
        Integer accountId = getAccountId(userDetails);
        bookingService.cancelBooking(bookingId, accountId);
        return ResponseEntity.ok("Booking cancelled successfully");
    }

    /** Get available additional services */
    @GetMapping("/services")
    public ResponseEntity<List<AdditionalService>> getAvailableServices() {
        return ResponseEntity.ok(paymentService.getAvailableServices());
    }

    /** Create a payment (Cart Checkout) */
    @PostMapping("/payments/create")
    public ResponseEntity<PaymentCreateResponse> createPayment(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody PaymentCreateRequest request) {
        Integer accountId = getAccountId(userDetails);
        return ResponseEntity.ok(paymentService.createPayment(accountId, request));
    }

    /** Submit a new feedback/incident report */
    @PostMapping("/feedbacks")
    public ResponseEntity<UserFeedbackTicket> createFeedback(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody FeedbackCreateRequest request) {
        Integer accountId = getAccountId(userDetails);
        return ResponseEntity.ok(feedbackService.createFeedback(accountId, request));
    }

    /** Get my feedback history */
    @GetMapping("/feedbacks")
    public ResponseEntity<List<UserFeedbackTicket>> getMyFeedbacks(
            @AuthenticationPrincipal UserDetails userDetails) {
        Integer accountId = getAccountId(userDetails);
        return ResponseEntity.ok(feedbackService.getMyFeedbacks(accountId));
    }

    /** Track my current (active) parking sessions */
    @GetMapping("/my-sessions")
    public ResponseEntity<List<ParkingSession>> getMySessions(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(required = false, defaultValue = "Active") String status) {
        
        Integer accountId = getAccountId(userDetails);
        return ResponseEntity.ok(sessionRepository.findByAccount_AccountIdAndStatus(accountId, status));
    }

    /** Preview active session fee for pre-payment */
    @GetMapping("/my-sessions/active/preview")
    public ResponseEntity<?> previewActiveSession(
            @AuthenticationPrincipal UserDetails userDetails) {
        Integer accountId = getAccountId(userDetails);
        // Find the active session for this user.
        // Assuming a user only has 1 active session at a time in this MVP.
        List<ParkingSession> activeSessions = sessionRepository.findByAccount_AccountIdAndStatus(accountId, "Active");
        if (activeSessions.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("message", "No active parking session found for your account."));
        }
        Integer sessionId = activeSessions.get(0).getSessionId();
        return ResponseEntity.ok(checkOutService.previewCheckOut(sessionId));
    }

    /** Pre-pay active session */
    @PostMapping("/my-sessions/{sessionId}/pre-pay")
    public ResponseEntity<PaymentTransaction> prePaySession(
            @PathVariable Integer sessionId,
            @RequestParam String paymentMethod,
            @AuthenticationPrincipal UserDetails userDetails) {
        
        // Security check: ensure the session belongs to the current user
        Integer accountId = getAccountId(userDetails);
        ParkingSession session = sessionRepository.findById(sessionId)
            .orElseThrow(() -> new RuntimeException("Session not found"));
            
        if (session.getAccount() == null || !session.getAccount().getAccountId().equals(accountId)) {
            throw new RuntimeException("Unauthorized: Session does not belong to you.");
        }
        
        return ResponseEntity.ok(checkOutService.prePaySession(sessionId, paymentMethod));
    }
}



