package com.parking.backend.model.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VehicleConfigItemDTO {

    @NotNull(message = "VehicleType ID is required")
    private Integer vehicleTypeId;

    @Positive(message = "Max height must be positive")
    private Double maxHeight;

    @Positive(message = "Max weight must be positive")
    private Double maxWeight;

    @NotNull(message = "isSupported flag is required")
    private Boolean isSupported;

}
