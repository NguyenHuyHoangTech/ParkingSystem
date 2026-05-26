package com.parking.backend.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Map;
import java.util.TreeMap;
import java.util.UUID;

@Service
@Slf4j
public class VNPayService {

    // Dummy secret key for testing
    private static final String VNP_HASH_SECRET = "DUMMY_SECRET_KEY_1234567890_TEST";
    private static final String VNP_URL = "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";
    private static final String VNP_RETURN_URL = "http://localhost:3000/payment-success";
    private static final String VNP_TMN_CODE = "DUMMY123";

    public String createPaymentUrl(double amount, String orderInfo) {
        Map<String, String> vnp_Params = new TreeMap<>();
        vnp_Params.put("vnp_Version", "2.1.0");
        vnp_Params.put("vnp_Command", "pay");
        vnp_Params.put("vnp_TmnCode", VNP_TMN_CODE);
        vnp_Params.put("vnp_Amount", String.valueOf((long) (amount * 100)));
        vnp_Params.put("vnp_CurrCode", "VND");
        
        String txnRef = UUID.randomUUID().toString().substring(0, 8);
        vnp_Params.put("vnp_TxnRef", txnRef);
        vnp_Params.put("vnp_OrderInfo", orderInfo);
        vnp_Params.put("vnp_OrderType", "other");
        vnp_Params.put("vnp_Locale", "vn");
        vnp_Params.put("vnp_ReturnUrl", VNP_RETURN_URL);
        vnp_Params.put("vnp_IpAddr", "127.0.0.1");

        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyyMMddHHmmss");
        vnp_Params.put("vnp_CreateDate", formatter.format(LocalDateTime.now()));

        StringBuilder hashData = new StringBuilder();
        StringBuilder query = new StringBuilder();
        for (Map.Entry<String, String> entry : vnp_Params.entrySet()) {
            if ((entry.getValue() != null) && (entry.getValue().length() > 0)) {
                hashData.append(entry.getKey()).append('=').append(URLEncoder.encode(entry.getValue(), StandardCharsets.US_ASCII)).append('&');
                query.append(URLEncoder.encode(entry.getKey(), StandardCharsets.US_ASCII)).append('=').append(URLEncoder.encode(entry.getValue(), StandardCharsets.US_ASCII)).append('&');
            }
        }
        query.setLength(query.length() - 1);
        hashData.setLength(hashData.length() - 1);

        // Simple mock of HMAC SHA512
        String vnp_SecureHash = "dummy_hash_" + System.currentTimeMillis();
        query.append("&vnp_SecureHash=").append(vnp_SecureHash);

        return VNP_URL + "?" + query.toString();
    }
}
