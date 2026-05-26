package com.parking.backend.repository;

import com.parking.backend.model.entity.RolePermission;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RolePermissionRepository extends JpaRepository<RolePermission, Integer> {
    List<RolePermission> findBySystemRole_RoleCode(String roleCode);
    void deleteBySystemRole_RoleCode(String roleCode);
}
