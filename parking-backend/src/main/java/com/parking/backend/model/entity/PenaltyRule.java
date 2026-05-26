package com.parking.backend.model.entity;

import jakarta.persistence.*;
import lombok.*;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@Entity
@Table(name = "PenaltyRules")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class PenaltyRule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "rule_id")
    private Integer ruleId;

    // lost_card, damaged_card, overtime, wrong_zone
    @Column(name = "rule_type", nullable = false, length = 30)
    private String ruleType;

    @Column(name = "fine_amount", nullable = false)
    private Double fineAmount;

    @Column(name = "description", length = 255)
    private String description;
}
