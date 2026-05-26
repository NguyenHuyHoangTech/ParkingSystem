package com.parking.backend.model.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MonthlyTicketDTO {
    private Integer ticketId;
    private String licensePlate;
    private String customerName;
    private String phoneNumber;
    private LocalDate startDate;
    private LocalDate endDate;
    private Integer vehicleTypeId;
    private String status;
}
