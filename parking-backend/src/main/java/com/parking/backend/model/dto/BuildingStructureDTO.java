package com.parking.backend.model.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BuildingStructureDTO {
    private Integer structureId; // Null for new structure
    private String name;
    private String type; // Wall, Pillar, Gate, etc.
    private Integer posX;
    private Integer posY;
    private Integer width;
    private Integer height;
}
