package com.parking.backend.model.dto;

import lombok.Data;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

@Data
public class SlotUpdateDTO {
    @NotBlank(message = "Status is required")
    private String status;

    @NotBlank(message = "Reason is required")
    private String reason;

    @NotNull(message = "autoReallocate flag is required")
    private Boolean autoReallocate;
}
