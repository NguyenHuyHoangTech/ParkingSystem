package com.parking.backend.model.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.util.List;

@Data
public class IncidentRequest {
    @NotNull(message = "Session ID is required")
    private Integer sessionId;

    @NotBlank(message = "Incident type is required")
    private String incidentType; // LOST_CARD, WRONG_PLATE, WRONG_ZONE

    private String description;

    private List<String> evidenceImages;

    private Integer newSlotId; // Only applicable for WRONG_ZONE
}
