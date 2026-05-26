package com.parking.backend.model.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "ConfigurationAuditLogs")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ConfigurationAuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "audit_id")
    private Integer auditId;

    @Column(name = "config_key", nullable = false, length = 100)
    private String configKey;

    @Column(name = "old_value", columnDefinition = "NVARCHAR(MAX)")
    private String oldValue;

    @Column(name = "new_value", columnDefinition = "NVARCHAR(MAX)")
    private String newValue;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "changed_by", nullable = false)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Account changedByAccount;

    @Column(name = "changed_at", nullable = false)
    private LocalDateTime changedAt;
}
