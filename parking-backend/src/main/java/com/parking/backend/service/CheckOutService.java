package com.parking.backend.service;

import com.parking.backend.model.dto.CheckOutRequest;
import com.parking.backend.model.dto.CheckOutResponse;
import com.parking.backend.exception.LicensePlateMismatchException;
import com.parking.backend.model.entity.*;
import com.parking.backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CheckOutService {

    private final ParkingSessionRepository sessionRepository;
    private final SlotRepository slotRepository;
    private final PricingPolicyRepository pricingPolicyRepository;
    private final SystemConfigurationRepository systemConfigurationRepository;
    private final ExceptionLogRepository exceptionLogRepository;
    private final NotificationService notificationService;
    private final TimeService timeService;
    private final BookingRepository bookingRepository;
    private final ParkingCardRepository parkingCardRepository;
    private final PaymentTransactionRepository paymentTransactionRepository;
    private final GateRepository gateRepository;
    private final AccountRepository accountRepository;
    private final MonthlyTicketRepository monthlyTicketRepository;

    /**
     * Find Active session by license plate for checkout.
     */
    public ParkingSession findActiveSession(String licensePlate, String cardCode) {
        if (licensePlate != null && !licensePlate.trim().isEmpty()) {
            return sessionRepository.findByLicensePlateInAndStatus(licensePlate, "Active")
                .orElseThrow(() -> new RuntimeException("Active session not found for license plate: " + licensePlate));
        } else if (cardCode != null && !cardCode.trim().isEmpty()) {
            return sessionRepository.findByCardCodeAndStatus(cardCode, "Active")
                .orElseThrow(() -> new RuntimeException("Active session not found for card code: " + cardCode));
        }
        throw new RuntimeException("Please provide license plate or card code");
    }

    public ParkingSession findActiveSessionBySlot(Integer slotId) {
        return sessionRepository.findBySlot_SlotIdAndStatus(slotId, "Active")
                .orElseThrow(() -> new RuntimeException("Active session not found for slot ID: " + slotId));
    }

    /**
     * Calculate estimated fee (preview before confirmation).
     */
    @Transactional(readOnly = true)
    public CheckOutResponse previewCheckOut(Integer sessionId) {
        ParkingSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Session not found"));

        LocalDateTime now = timeService.now();
        long durationMinutes = ChronoUnit.MINUTES.between(session.getTimeIn(), now);

        int gracePeriodMinutes = getGracePeriodMinutes();
        if (durationMinutes <= gracePeriodMinutes) {
            durationMinutes = 0; // Free during grace period
        }

        // Calculate Base Fee considering Previous Payments (Pre-payment)
        List<PaymentTransaction> successfulPayments = paymentTransactionRepository
                .findBySession_SessionIdAndStatusOrderByPaymentTimeDesc(sessionId, "SUCCESS");

        double totalFeeBeforePenalty = 0;
        double remainingFeeToPay = 0;
        double sumPrepaid = successfulPayments.stream().mapToDouble(PaymentTransaction::getAmount).sum();

        if (successfulPayments.isEmpty()) {
            totalFeeBeforePenalty = calculateFee(session.getVehicleType().getTypeId(), durationMinutes, session.getSlot());
            remainingFeeToPay = totalFeeBeforePenalty;
        } else {
            LocalDateTime lastPaymentTime = successfulPayments.get(0).getPaymentTime();
            long deltaMinutes = ChronoUnit.MINUTES.between(lastPaymentTime, now);

            if (deltaMinutes <= gracePeriodMinutes) {
                // Within grace period, no extra fee
                totalFeeBeforePenalty = sumPrepaid;
                remainingFeeToPay = 0;
            } else {
                // Breached grace period, calculate total fee from TimeIn and subtract what was paid
                totalFeeBeforePenalty = calculateFee(session.getVehicleType().getTypeId(), durationMinutes, session.getSlot());
                remainingFeeToPay = Math.max(0, totalFeeBeforePenalty - sumPrepaid);
            }
        }

        double fee = remainingFeeToPay;

        // Check if there is an active Monthly Ticket for this license plate
        monthlyTicketRepository.findByLicensePlate(session.getLicensePlateIn()).ifPresent(ticket -> {
            if ("ACTIVE".equalsIgnoreCase(ticket.getStatus()) && !now.toLocalDate().isBefore(ticket.getStartDate()) && !now.toLocalDate().isAfter(ticket.getEndDate())) {
                // Base fee is covered by monthly ticket
            }
        });
        
        // Wait, the fee should be modified inside the ifPresent
        java.util.Optional<MonthlyTicket> monthlyTicketOpt = monthlyTicketRepository.findByLicensePlate(session.getLicensePlateIn());
        if (monthlyTicketOpt.isPresent() && "ACTIVE".equalsIgnoreCase(monthlyTicketOpt.get().getStatus())) {
            MonthlyTicket ticket = monthlyTicketOpt.get();
            if (!now.toLocalDate().isBefore(ticket.getStartDate()) && !now.toLocalDate().isAfter(ticket.getEndDate())) {
                fee = 0;
            }
        }

        // Check if there is a CHECKED_IN booking for this session
        double overtimeFee = 0;
        List<Booking> bookings = bookingRepository.findBySlot_SlotIdAndStatusIn(session.getSlot().getSlotId(), List.of("CHECKED_IN"));
        for (Booking b : bookings) {
            if (b.getLicensePlate() != null && b.getLicensePlate().equalsIgnoreCase(session.getLicensePlateIn())) {
                // It's a booked session. The base fee was already paid (or recorded in Booking).
                fee = 0; // Base fee is covered by booking
                if (now.isAfter(b.getEndTime())) {
                    long overtimeMinutes = ChronoUnit.MINUTES.between(b.getEndTime(), now);
                    if (overtimeMinutes > gracePeriodMinutes) {
                        overtimeFee = calculateFee(session.getVehicleType().getTypeId(), overtimeMinutes, session.getSlot());
                    }
                }
                break;
            }
        }
        fee += overtimeFee;

        // Calculate fine from non-rejected exceptions
        List<ExceptionLog> exceptions = exceptionLogRepository.findBySession_SessionId(sessionId);
        double penaltyFee = exceptions.stream()
                .filter(e -> !"Rejected".equalsIgnoreCase(e.getStatus()))
                .filter(e -> e.getFineApplied() != null)
                .mapToDouble(ExceptionLog::getFineApplied)
                .sum();

        List<String> incidentDetails = exceptions.stream()
                .filter(e -> "Pending".equalsIgnoreCase(e.getStatus()) || "In Progress".equalsIgnoreCase(e.getStatus()))
                .map(ExceptionLog::getExceptionType)
                .toList();

        Slot slot = session.getSlot();
        Floor floor = slot.getFloor();

        return CheckOutResponse.builder()
                .sessionId(session.getSessionId())
                .licensePlate(session.getLicensePlateIn())
                .timeIn(session.getTimeIn())
                .timeOut(now)
                .durationMinutes(durationMinutes)
                .totalFee(fee + penaltyFee)
                .penaltyFee(penaltyFee)
                .vehicleTypeName(session.getVehicleType().getTypeName())
                .slotName(slot.getSlotName())
                .floorName(floor.getFloorName())
                .buildingId(floor.getParkingBuilding().getBuildingId())
                .isFlagged(Boolean.TRUE.equals(session.getIsFlagged()))
                .incidentDetails(incidentDetails)
                .build();
    }

    /**
     * Confirm vehicle exit, update DB.
     */
    @Transactional(rollbackFor = Exception.class)
    public CheckOutResponse confirmCheckOut(Integer sessionId, CheckOutRequest request) {
        ParkingSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Session not found"));

        if (!"Active".equalsIgnoreCase(session.getStatus())) {
            throw new RuntimeException("Session is not active");
        }
        
        if (Boolean.TRUE.equals(session.getIsFlagged())) {
            throw new RuntimeException("Session is flagged due to an unresolved incident. Please wait for Manager override.");
        }
        
        // License Plate Mismatch Check
        if (!session.getLicensePlateIn().equalsIgnoreCase(request.getExitPlate())) {
            if (!request.isOverrideFlag()) {
                throw new LicensePlateMismatchException("Exit plate (" + request.getExitPlate() + ") does not match Entry plate (" + session.getLicensePlateIn() + ").");
            }
        }

        LocalDateTime now = timeService.now();
        long durationMinutes = Math.max(1, ChronoUnit.MINUTES.between(session.getTimeIn(), now));

        int gracePeriodMinutes = getGracePeriodMinutes();
        long billableMinutes = durationMinutes <= gracePeriodMinutes ? 0 : durationMinutes;

        // Calculate Base Fee considering Previous Payments
        List<PaymentTransaction> successfulPayments = paymentTransactionRepository
                .findBySession_SessionIdAndStatusOrderByPaymentTimeDesc(sessionId, "SUCCESS");

        double totalFeeBeforePenalty = 0;
        double remainingFeeToPay = 0;
        double sumPrepaid = successfulPayments.stream().mapToDouble(PaymentTransaction::getAmount).sum();

        if (successfulPayments.isEmpty()) {
            totalFeeBeforePenalty = calculateFee(session.getVehicleType().getTypeId(), billableMinutes, session.getSlot());
            remainingFeeToPay = totalFeeBeforePenalty;
        } else {
            LocalDateTime lastPaymentTime = successfulPayments.get(0).getPaymentTime();
            long deltaMinutes = ChronoUnit.MINUTES.between(lastPaymentTime, now);

            if (deltaMinutes <= gracePeriodMinutes) {
                totalFeeBeforePenalty = sumPrepaid;
                remainingFeeToPay = 0;
            } else {
                totalFeeBeforePenalty = calculateFee(session.getVehicleType().getTypeId(), durationMinutes, session.getSlot());
                remainingFeeToPay = Math.max(0, totalFeeBeforePenalty - sumPrepaid);
            }
        }

        double fee = remainingFeeToPay;

        // Check if there is an active Monthly Ticket for this license plate
        java.util.Optional<MonthlyTicket> monthlyTicketOpt = monthlyTicketRepository.findByLicensePlate(session.getLicensePlateIn());
        if (monthlyTicketOpt.isPresent() && "ACTIVE".equalsIgnoreCase(monthlyTicketOpt.get().getStatus())) {
            MonthlyTicket ticket = monthlyTicketOpt.get();
            if (!now.toLocalDate().isBefore(ticket.getStartDate()) && !now.toLocalDate().isAfter(ticket.getEndDate())) {
                fee = 0;
            }
        }

        // Check if there is a CHECKED_IN booking for this session
        double overtimeFee = 0;
        List<Booking> bookings = bookingRepository.findBySlot_SlotIdAndStatusIn(session.getSlot().getSlotId(), List.of("CHECKED_IN"));
        for (Booking b : bookings) {
            if (b.getLicensePlate() != null && b.getLicensePlate().equalsIgnoreCase(session.getLicensePlateIn())) {
                fee = 0; // Base fee covered by booking
                if (now.isAfter(b.getEndTime())) {
                    long overtimeMinutes = ChronoUnit.MINUTES.between(b.getEndTime(), now);
                    if (overtimeMinutes > gracePeriodMinutes) {
                        overtimeFee = calculateFee(session.getVehicleType().getTypeId(), overtimeMinutes, session.getSlot());
                    }
                }
                // Mark booking as completed
                b.setStatus("COMPLETED");
                bookingRepository.save(b);
                break;
            }
        }
        fee += overtimeFee;

        // Calculate fine from non-rejected exceptions
        List<ExceptionLog> exceptions = exceptionLogRepository.findBySession_SessionId(sessionId);
        double penaltyFee = exceptions.stream()
                .filter(e -> !"Rejected".equalsIgnoreCase(e.getStatus()))
                .filter(e -> e.getFineApplied() != null)
                .mapToDouble(ExceptionLog::getFineApplied)
                .sum();

        // Automatically resolve all pending exceptions for this session upon successful
        // payment
        for (ExceptionLog exception : exceptions) {
            if ("Pending".equalsIgnoreCase(exception.getStatus())) {
                exception.setStatus("Resolved");
                exception.setResolvedAt(now);
                exception.setResolutionNote("Auto-resolved by system upon check-out (successful exit)");
                exceptionLogRepository.save(exception);
            }
        }

        // Fetch Gate and Staff
        Gate exitGate = gateRepository.findById(request.getGateId())
                .orElseThrow(() -> new RuntimeException("Gate not found"));
        Account staff = accountRepository.findById(request.getStaffId())
                .orElseThrow(() -> new RuntimeException("Staff not found"));

        // Update session (including parking fee + fine)
        session.setTimeOut(now);
        session.setLicensePlateOut(request.getExitPlate());
        session.setTotalFee(sumPrepaid + fee + penaltyFee);
        session.setExitGate(exitGate);
        session.setCheckOutStaff(staff);
        session.setStatus("Completed");
        sessionRepository.save(session);
        
        // Record Payment Transaction ONLY if there is remaining fee to pay at gate
        if ((fee + penaltyFee) > 0) {
            PaymentTransaction payment = PaymentTransaction.builder()
                    .session(session)
                    .amount(fee + penaltyFee)
                    .paymentMethod(request.getPaymentMethod())
                    .paymentTime(now)
                    .status("SUCCESS")
                    .build();
            paymentTransactionRepository.save(payment);
        }
        
        // Release physical card
        if (session.getParkingCard() != null) {
            ParkingCard card = session.getParkingCard();
            card.setStatus("AVAILABLE");
            parkingCardRepository.save(card);
        }

        // Free the slot
        Slot slot = session.getSlot();
        slot.setStatus("Available");
        slotRepository.save(slot);
        notificationService.broadcast("SLOTS_UPDATED", "Slot freed via Check-Out");

        Floor floor = slot.getFloor();
        
        // Send E-receipt Push Notification
        notificationService.broadcast("PUSH_NOTIFICATION", 
            "Hóa đơn điện tử: Xe " + session.getLicensePlateIn() + " đã ra khỏi bãi. Tổng phí: " + (fee + penaltyFee) + " VNĐ.");

        return CheckOutResponse.builder()
                .sessionId(session.getSessionId())
                .licensePlate(session.getLicensePlateIn())
                .timeIn(session.getTimeIn())
                .timeOut(now)
                .durationMinutes(billableMinutes)
                .totalFee(fee + penaltyFee)
                .penaltyFee(penaltyFee)
                .vehicleTypeName(session.getVehicleType().getTypeName())
                .slotName(slot.getSlotName())
                .build();
    }

    /**
     * Pre-pay an active session.
     */
    @Transactional(rollbackFor = Exception.class)
    public PaymentTransaction prePaySession(Integer sessionId, String paymentMethod) {
        ParkingSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Session not found"));

        if (!"Active".equalsIgnoreCase(session.getStatus())) {
            throw new RuntimeException("Cannot pre-pay a non-active session.");
        }

        CheckOutResponse preview = previewCheckOut(sessionId);
        double amountToPay = preview.getTotalFee();

        if (amountToPay <= 0) {
            throw new RuntimeException("No outstanding balance to pay.");
        }

        PaymentTransaction payment = PaymentTransaction.builder()
                .session(session)
                .amount(amountToPay)
                .paymentMethod(paymentMethod)
                .paymentTime(timeService.now())
                .status("SUCCESS")
                .build();

        return paymentTransactionRepository.save(payment);
    }

    /**
     * Calculate fee based on time block config.
     * Example: First 2 hours = First_Block, next hours = Next_Blocks
     */
    private double calculateFee(Integer typeId, long durationMinutes, Slot slot) {
        if (durationMinutes <= 0)
            return 0.0;

        Integer buildingId = slot.getFloor().getParkingBuilding().getBuildingId();
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

        // Process blocks in order of their time Frame if needed. But for simple duration-based:
        // Assume single block logic for now (First block + Subsequent blocks)
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

    private int getGracePeriodMinutes() {
        return systemConfigurationRepository.findById("grace_period_minutes")
                .map(c -> Integer.parseInt(c.getConfigValue()))
                .orElse(0);
    }
}

