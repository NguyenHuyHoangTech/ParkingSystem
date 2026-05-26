package com.parking.backend.model.entity;

import jakarta.persistence.*;
import lombok.*;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@Entity
@org.hibernate.annotations.SQLDelete(sql = "UPDATE Slots SET is_deleted = 1 WHERE slot_id=?")
@org.hibernate.annotations.Where(clause = "is_deleted=0")
@Table(name = "Slots")
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Slot extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "slot_id")
    private Integer slotId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "floor_id", nullable = false)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    @JsonIgnoreProperties("slots")
    private Floor floor;

    @Column(name = "allow_pre_booking")
    @Builder.Default
    private Boolean allowPreBooking = false;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "type_id")
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private VehicleType vehicleType;

    @Column(name = "slot_name", length = 20)
    private String slotName;

    @Column(name = "pos_x")
    private Integer posX;

    @Column(name = "pos_y")
    private Integer posY;

    // Available, Occupied, Booked, Maintenance, Locked
    @Column(name = "status", nullable = false, length = 20)
    private String status;
}


