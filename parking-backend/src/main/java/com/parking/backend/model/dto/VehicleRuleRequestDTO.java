package com.parking.backend.model.dto;

import lombok.Data;
import jakarta.validation.constraints.NotNull;
import java.util.List;

@Data
public class VehicleRuleRequestDTO {

    @NotNull(message = "Vehicle type ID is required")
    private Integer vehicleTypeId;

    @NotNull(message = "Grace period is required")
    private Integer gracePeriodMinutes;

    private Double maxDailyCap;

    private Double lostTicketSurcharge;

    private List<BlockRequestDTO> blocks;
}
