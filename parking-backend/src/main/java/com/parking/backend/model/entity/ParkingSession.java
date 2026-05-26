package com.parking.backend.model.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "ParkingSessions")
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class ParkingSession extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "session_id")
    private Integer sessionId;

    // Electronic parking card code sent to customer
    @Column(name = "card_code", length = 50)
    private String cardCode;

    @Column(name = "license_plate_in", length = 20)
    private String licensePlateIn;

    @Column(name = "license_plate_out", length = 20)
    private String licensePlateOut;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "type_id")
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    @JsonIgnoreProperties("hibernate_lazy_initializer")
    private VehicleType vehicleType;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "slot_id")
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    @JsonIgnoreProperties({"zone"})
    private Slot slot;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "account_id")
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    @JsonIgnoreProperties({"passwordHash"})
    private Account account;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "gate_id")
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Gate entryGate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "check_in_staff_id")
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    @JsonIgnoreProperties({"passwordHash"})
    private Account checkInStaff;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "exit_gate_id")
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Gate exitGate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "check_out_staff_id")
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    @JsonIgnoreProperties({"passwordHash"})
    private Account checkOutStaff;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "card_id")
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private ParkingCard parkingCard;

    @Column(name = "time_in")
    private LocalDateTime timeIn;

    @Column(name = "time_out")
    private LocalDateTime timeOut;

    @Column(name = "total_fee")
    private Double totalFee;

    // Active, Completed, Cancelled
    @Column(name = "status", nullable = false, length = 20)
    private String status;

    @Column(name = "car_image_in", length = 255)
    private String carImageIn;

    @Column(name = "car_image_out", length = 255)
    private String carImageOut;

    @Column(name = "is_flagged")
    private Boolean isFlagged = false;
}

