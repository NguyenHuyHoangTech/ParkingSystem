package com.parking.backend.model.dto;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class CheckOutResponse {
    private Integer sessionId;
    private String licensePlate;
    private LocalDateTime timeIn;
    private LocalDateTime timeOut;
    private long durationMinutes;
    private double totalFee;
    private double penaltyFee;
    private String vehicleTypeName;
    private String slotName;
    private String floorName;
    private Integer buildingId;
    private Boolean isFlagged;
    private List<String> incidentDetails;
}
