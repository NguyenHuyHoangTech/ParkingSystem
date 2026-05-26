package com.parking.backend.model.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VehicleCapacityDTO {
    private Integer vehicleTypeId;
    private String vehicleTypeName;
    private Integer totalCapacity;
    private Integer availableSlots;
}
