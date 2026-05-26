package com.parking.backend.model.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class FloorAvailabilityDTO {
    private Integer floorId;
    private String floorName;
    private Integer totalCapacity;
    private Integer availableCapacity;
    private Double estimatedFee;
}
