package com.parking.backend.model.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalTime;

@Entity
@Table(name = "PricingBlocks")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class PricingBlock {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "block_id")
    private Integer blockId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "rule_id", nullable = false)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    @com.fasterxml.jackson.annotation.JsonIgnore
    private VehiclePricingRule rule;

    @Column(name = "time_frame_start", nullable = false)
    private LocalTime timeFrameStart;

    @Column(name = "time_frame_end", nullable = false)
    private LocalTime timeFrameEnd;

    @Column(name = "first_block_duration_minutes", nullable = false)
    private Integer firstBlockDurationMinutes;

    @Column(name = "first_block_rate", nullable = false)
    private Double firstBlockRate;

    @Column(name = "subsequent_block_duration_minutes", nullable = false)
    private Integer subsequentBlockDurationMinutes;

    @Column(name = "subsequent_block_rate", nullable = false)
    private Double subsequentBlockRate;
}
