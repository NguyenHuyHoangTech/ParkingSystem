package com.parking.backend.model.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WebhookPayload {
    private Integer transactionId;
    private String gatewayReferenceId;
    private String status; // SUCCESS or FAILED
    private String checksum; // HMAC signature
}
