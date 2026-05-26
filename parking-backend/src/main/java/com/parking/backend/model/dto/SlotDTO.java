package com.parking.backend.model.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SlotDTO {
    private Integer slotId; // Null for new slot
    private String slotName;
    private String status; // Available, Occupied, Maintenance
    private Integer posX;
    private Integer posY;
    private Boolean allowPreBooking;
    private Integer typeId;
}
