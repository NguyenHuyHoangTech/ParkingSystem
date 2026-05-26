package com.parking.backend.repository;

import com.parking.backend.model.entity.Permission;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PermissionRepository extends JpaRepository<Permission, Integer> {
    Permission findByPermissionCode(String permissionCode);
}
