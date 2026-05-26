package com.parking.backend.controller;

import com.parking.backend.service.VNPayService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.parking.backend.repository.PaymentTransactionRepository;
import com.parking.backend.model.entity.PaymentTransaction;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/v1/payment")
public class PaymentController {

    @Autowired
    private VNPayService vnPayService;

    @Autowired
    private PaymentTransactionRepository paymentTransactionRepository;

    @GetMapping("/vnpay/create-url")
    public ResponseEntity<?> createPaymentUrl(@RequestParam double amount, @RequestParam String orderInfo) {
        String paymentUrl = vnPayService.createPaymentUrl(amount, orderInfo);
        return ResponseEntity.ok(Map.of("url", paymentUrl));
    }

    @PostMapping("/vnpay/ipn")
    public ResponseEntity<?> vnpayIpn(@RequestBody Map<String, String> payload) {
        System.out.println("Received IPN from VNPay: " + payload);
        String txnRef = payload.get("vnp_TxnRef");
        
        if (txnRef != null) {
            Optional<PaymentTransaction> txnOpt = paymentTransactionRepository.findByGatewayReferenceId(txnRef);
            if (txnOpt.isPresent()) {
                PaymentTransaction txn = txnOpt.get();
                txn.setStatus("SUCCESS");
                paymentTransactionRepository.save(txn);
                System.out.println("Updated transaction " + txn.getTransactionId() + " to SUCCESS");
            }
        }
        
        return ResponseEntity.ok(Map.of("RspCode", "00", "Message", "Confirm Success"));
    }
}
