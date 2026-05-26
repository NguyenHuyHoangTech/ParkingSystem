package com.parking.backend.model.dto;

import lombok.Data;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class PricingPolicyRequestDTO {

    @NotBlank(message = "Policy name is required")
    private String policyName;

    @NotNull(message = "Effective date is required")
    private LocalDateTime effectiveDate;

    private LocalDateTime expiryDate;

    private List<VehicleRuleRequestDTO> rules;
}
