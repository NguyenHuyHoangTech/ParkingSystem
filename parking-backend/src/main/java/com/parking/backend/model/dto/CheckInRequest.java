package com.parking.backend.model.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CheckInRequest {
    @NotBlank(message = "License plate is required")
    private String licensePlate;

    @NotNull(message = "Vehicle type is required")
    private Integer typeId;

    @NotNull(message = "Slot is required")
    private Integer slotId;

    // Booking ID for pre-booked customers
    private Integer bookingId;

    // Entry gate
    private Integer gateId;

    // Staff checking in
    private Integer staffId;

    // Card code from physical scanner
    @NotBlank(message = "Card code is required")
    private String cardCode;
}
