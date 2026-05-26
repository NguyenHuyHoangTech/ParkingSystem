package com.parking.backend.model.dto;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Builder
public class IncidentResponseDTO {
    private Integer incidentId;
    private Integer sessionId;
    private String exceptionType;
    private String description;
    private String status;
    private String reportedBy;
    private LocalDateTime createdAt;
    private LocalDateTime resolvedAt;
    private Double fineApplied;
    private String resolutionNote;
    private String carImageIn;
    private String carImageOut;
    private String licensePlate;
}
