package com.parking.backend.model.dto;

import lombok.Builder;
import lombok.Data;
import java.util.List;

/**
 * Result returned when staff checks entry conditions.
 * Includes suggestions for the most suitable floor/zone/slot.
 */
@Data
@Builder
public class CheckInCheckResponse {
    private boolean canEnter;
    private String message;

    // Detected type: MONTHLY, BOOKING, TRANSIENT
    private String entryType;

    // Suggested floor info
    private Integer suggestedFloorId;
    private String suggestedFloorName;

    // Specific suggested slot (if any)
    private Integer suggestedSlotId;
    private String suggestedSlotName;

    // If pre-booked customer
    private Integer bookingId;

    // Number of available slots in suggested zone
    private Long availableSlots;
}
