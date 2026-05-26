package com.parking.backend.model.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.Min;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;
import jakarta.validation.Valid;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FloorUpdateDTO {
    
    private Integer floorId; // Null for new floor
    
    @NotBlank(message = "Tên tầng không được để trống")
    @Size(max = 50, message = "Tên tầng không được vượt quá 50 ký tự")
    private String floorName;
    
    private String status; // Active, Inactive
    
    private Integer floorOrder;
    
    private Integer mapCols;
    
    private Integer mapRows;
    
    @Valid
    private List<SlotDTO> slots;
    
    @Valid
    private List<BuildingStructureDTO> structures;
}
