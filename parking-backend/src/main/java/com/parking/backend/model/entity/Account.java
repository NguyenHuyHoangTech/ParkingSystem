package com.parking.backend.model.entity;

import jakarta.persistence.*;
import lombok.*;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@Entity
@org.hibernate.annotations.SQLDelete(sql = "UPDATE Accounts SET is_deleted = 1 WHERE account_id=?")
@org.hibernate.annotations.Where(clause = "is_deleted=0")
@Table(name = "Accounts")
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Account extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "account_id")
    private Integer accountId;

    @Column(name = "username", nullable = false, unique = true, length = 50)
    private String username;

    @Column(name = "password_hash", nullable = false, length = 255)
    private String passwordHash;

    @Column(name = "email", length = 100)
    private String email;

    @Column(name = "full_name", length = 150)
    private String fullName;

    @Column(name = "phone_number", length = 20)
    private String phoneNumber;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "role_code", referencedColumnName = "role_code", nullable = false)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private SystemRole systemRole;

    public String getRole() {
        return systemRole != null ? systemRole.getRoleCode() : null;
    }

    public void setRole(String roleCode) {
        if (this.systemRole == null) {
            this.systemRole = new SystemRole();
        }
        this.systemRole.setRoleCode(roleCode);
    }

    @Column(name = "status", nullable = false, length = 20)
    private String status; // Active, Banned

    @Transient
    private Integer buildingId;
}


