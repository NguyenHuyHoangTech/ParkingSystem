package com.parking.backend.service;

import com.parking.backend.model.dto.*;
import com.parking.backend.model.entity.*;
import com.parking.backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.Formatter;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PaymentService {

    private final PaymentTransactionRepository paymentTransactionRepository;
    private final TransactionDetailRepository transactionDetailRepository;
    private final AdditionalServiceRepository additionalServiceRepository;
    private final ParkingSessionRepository sessionRepository;
    private final CheckOutService checkOutService;
    private final TimeService timeService;
    private final NotificationService notificationService;

    private static final String SECRET_KEY = "my_super_secret_key_for_webhook_signature";

    public List<AdditionalService> getAvailableServices() {
        return additionalServiceRepository.findAll();
    }

    @Transactional(rollbackFor = Exception.class)
    public PaymentCreateResponse createPayment(Integer accountId, PaymentCreateRequest request) {
        ParkingSession session = sessionRepository.findById(request.getSessionId())
                .orElseThrow(() -> new RuntimeException("Session not found"));

        if (!session.getAccount().getAccountId().equals(accountId)) {
            throw new RuntimeException("Unauthorized to pay for this session");
        }

        if (paymentTransactionRepository.existsBySession_SessionIdAndStatus(session.getSessionId(), "PENDING")) {
            throw new RuntimeException("A payment is already pending for this session. Please wait or cancel it.");
        }

        // Calculate Parking Fee (Zero Trust)
        CheckOutResponse preview = checkOutService.previewCheckOut(session.getSessionId());
        double parkingFee = preview.getTotalFee();

        double totalAmount = parkingFee;

        // Calculate Additional Services Fee
        List<AdditionalService> services = additionalServiceRepository.findAllById(request.getServiceIds());
        for (AdditionalService svc : services) {
            totalAmount += svc.getUnitPrice();
        }

        if (totalAmount <= 0) {
            throw new RuntimeException("No outstanding balance to pay.");
        }

        PaymentTransaction transaction = PaymentTransaction.builder()
                .session(session)
                .amount(totalAmount)
                .paymentMethod(request.getPaymentMethod())
                .paymentTime(timeService.now())
                .status("PENDING")
                .build();

        transaction = paymentTransactionRepository.save(transaction);

        // Save Details
        if (parkingFee > 0) {
            TransactionDetail detail = TransactionDetail.builder()
                    .transaction(transaction)
                    .itemType("PARKING_FEE")
                    .session(session)
                    .amount(parkingFee)
                    .build();
            transactionDetailRepository.save(detail);
        }

        for (AdditionalService svc : services) {
            TransactionDetail detail = TransactionDetail.builder()
                    .transaction(transaction)
                    .itemType("SERVICE_FEE")
                    .service(svc)
                    .amount(svc.getUnitPrice())
                    .build();
            transactionDetailRepository.save(detail);
        }

        return PaymentCreateResponse.builder()
                .transactionId(transaction.getTransactionId())
                .paymentUrl("http://localhost:5173/payment-gateway?txnId=" + transaction.getTransactionId() + "&amount=" + totalAmount)
                .build();
    }

    @Transactional(rollbackFor = Exception.class)
    public void processWebhook(WebhookPayload payload) {
        // Validate Checksum
        String rawData = payload.getTransactionId() + "|" + payload.getGatewayReferenceId() + "|" + payload.getStatus();
        String expectedSignature = calculateHMac(rawData, SECRET_KEY);

        if (!expectedSignature.equalsIgnoreCase(payload.getChecksum())) {
            throw new RuntimeException("Invalid signature. Potential tampering detected.");
        }

        PaymentTransaction transaction = paymentTransactionRepository.findById(payload.getTransactionId())
                .orElseThrow(() -> new RuntimeException("Transaction not found"));

        // Idempotency check
        if ("SUCCESS".equalsIgnoreCase(transaction.getStatus())) {
            return; // Already processed
        }

        transaction.setStatus(payload.getStatus());
        transaction.setGatewayReferenceId(payload.getGatewayReferenceId());
        transaction.setPaymentTime(timeService.now());
        paymentTransactionRepository.save(transaction);

        if ("SUCCESS".equalsIgnoreCase(payload.getStatus())) {
            notificationService.broadcast("PUSH_NOTIFICATION", "Payment of " + transaction.getAmount() + " successful. You have 15 minutes to exit.");
        }
    }

    public String calculateHMac(String data, String key) {
        try {
            SecretKeySpec secretKeySpec = new SecretKeySpec(key.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(secretKeySpec);
            byte[] hmacBytes = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
            return bytesToHex(hmacBytes);
        } catch (Exception e) {
            throw new RuntimeException("Failed to calculate HMAC", e);
        }
    }

    private static String bytesToHex(byte[] bytes) {
        Formatter formatter = new Formatter();
        for (byte b : bytes) {
            formatter.format("%02x", b);
        }
        String hex = formatter.toString();
        formatter.close();
        return hex;
    }
}
