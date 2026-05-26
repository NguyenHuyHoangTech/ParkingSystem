package com.parking.backend.model.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GateDTO {
    private Integer gateId;
    private String gateName;
    private String gateType;
    private Integer buildingId;
}
