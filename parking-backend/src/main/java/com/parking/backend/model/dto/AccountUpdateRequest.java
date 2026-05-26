package com.parking.backend.model.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AccountUpdateRequest {
    private String fullName;
    private String phoneNumber;
    private Integer buildingId; // If changed for Relocation
}
