package com.parking.backend.model.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FloorAllocationDTO {

    @NotNull(message = "Floor ID is required")
    private Integer floorId;

    @NotNull(message = "VehicleType ID is required")
    private Integer vehicleTypeId;

    @NotNull(message = "Priority Index is required")
    private Integer priorityIndex;

    @NotNull(message = "isActive flag is required")
    private Boolean isActive;
}
