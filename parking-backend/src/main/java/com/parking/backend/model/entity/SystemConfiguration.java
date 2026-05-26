package com.parking.backend.model.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "SystemConfigurations")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SystemConfiguration {

    @Id
    @Column(name = "config_key", length = 100)
    private String configKey;

    @Column(name = "config_value", columnDefinition = "NVARCHAR(MAX)")
    private String configValue;

    @Column(name = "data_type", nullable = false, length = 20)
    private String dataType; // BOOLEAN, INTEGER, STRING, JSON

    @Column(name = "category", nullable = false, length = 50)
    private String category; // SECURITY, PAYMENT, SYSTEM

    @Column(name = "description", length = 255)
    private String description;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "last_modified_by")
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Account lastModifiedByAccount;

    @Column(name = "last_modified_at")
    private LocalDateTime lastModifiedAt;
}
