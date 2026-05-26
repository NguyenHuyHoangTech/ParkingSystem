package com.parking.backend.model.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CheckOutRequest {
    @NotBlank(message = "Payment method is required")
    private String paymentMethod;
    
    @NotBlank(message = "Exit plate is required")
    private String exitPlate;
    
    @NotNull(message = "Gate ID is required")
    private Integer gateId;
    
    @NotNull(message = "Staff ID is required")
    private Integer staffId;
    
    // Bypass mismatch validation if Manager approved
    private boolean overrideFlag;
}
