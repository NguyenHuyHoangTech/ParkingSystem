package com.parking.backend.model.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "SystemRoles")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SystemRole {
    @Id
    @Column(name = "role_code", length = 50)
    private String roleCode;

    @Column(name = "role_name", nullable = false, length = 100)
    private String roleName;
}
