package com.parking.backend.model.dto;

import lombok.Data;
import jakarta.validation.constraints.NotNull;
import java.time.LocalTime;

@Data
public class BlockRequestDTO {

    @NotNull(message = "Time frame start is required")
    private LocalTime timeFrameStart;

    @NotNull(message = "Time frame end is required")
    private LocalTime timeFrameEnd;

    @NotNull(message = "First block duration is required")
    private Integer firstBlockDurationMinutes;

    @NotNull(message = "First block rate is required")
    private Double firstBlockRate;

    @NotNull(message = "Subsequent block duration is required")
    private Integer subsequentBlockDurationMinutes;

    @NotNull(message = "Subsequent block rate is required")
    private Double subsequentBlockRate;
}
