package com.parking.backend.model.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChartDataDTO {
    private String name; // e.g., "08:00", "Car", "Zone A"
    private Number value; // generic single value
    private Number entries; // for line chart
    private Number exits; // for line chart
}
