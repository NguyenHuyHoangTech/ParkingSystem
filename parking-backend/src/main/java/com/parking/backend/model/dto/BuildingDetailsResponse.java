package com.parking.backend.model.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalTime;
import java.util.List;

@Data
@Builder
public class BuildingDetailsResponse {
    private Integer buildingId;
    private String name;
    private String address;
    private Double latitude;
    private Double longitude;
    private LocalTime openTime;
    private LocalTime closeTime;
    private String status;
    private String rulesDescription;
    
    private List<VehicleCapacityDTO> capacities;
    private List<com.parking.backend.model.entity.PricingPolicy> policies;
}

