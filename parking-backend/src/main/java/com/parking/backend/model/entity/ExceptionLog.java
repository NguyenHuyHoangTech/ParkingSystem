package com.parking.backend.model.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "ExceptionLogs")
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class ExceptionLog extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "exception_id")
    private Integer exceptionId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_id")
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    @JsonIgnoreProperties({"slot", "account", "vehicleType"})
    private ParkingSession session;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "handled_by")
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    @JsonIgnoreProperties({"passwordHash"})
    private Account handledBy; // staff account

    // lost_card, wrong_plate, overtime, wrong_zone, unpaid
    @Column(name = "exception_type", nullable = false, length = 50)
    private String exceptionType;

    @Column(name = "description", length = 500)
    private String description;

    @Column(name = "fine_applied")
    private Double fineApplied;

    // Pending, Resolved, Rejected
    @Column(name = "status", nullable = false, length = 20)
    private String status;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "gate_id")
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Gate gate;

    @Column(name = "resolved_at")
    private LocalDateTime resolvedAt;

    @Column(name = "resolution_note", length = 500)
    private String resolutionNote;

    @Column(name = "reported_by", length = 50)
    private String reportedBy;

    @Column(name = "evidence_images", length = 2000)
    private String evidenceImages;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reported_by_account_id")
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    @JsonIgnoreProperties({"passwordHash"})
    private Account reportedByAccount;
}

