package com.parking.backend.model.entity;

import jakarta.persistence.*;
import lombok.*;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@Entity
@Table(name = "VehicleTypes")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class VehicleType {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "type_id")
    private Integer typeId;

    @Column(name = "type_name", nullable = false, length = 50)
    private String typeName;

    @Column(name = "size_multiplier")
    private Double sizeMultiplier;

    @Column(name = "status", length = 20)
    private String status; // Active, Inactive

    @Column(name = "grid_width")
    private Integer gridWidth;

    @Column(name = "grid_height")
    private Integer gridHeight;
}
