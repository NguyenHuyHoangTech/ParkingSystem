package com.parking.backend.model.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class IncidentResolveRequestDTO {
    
    @NotBlank(message = "Resolution note is required")
    @Size(min = 20, message = "Resolution note must be at least 20 characters long")
    private String resolutionNote;
    
    private String overrideAction; // Optional action info, e.g., "OVERRIDE_PLATE"
}
