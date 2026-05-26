package com.parking.backend.service;

import com.parking.backend.model.dto.RolePermissionUpdateRequest;
import com.parking.backend.model.entity.Permission;
import com.parking.backend.model.entity.RolePermission;
import com.parking.backend.model.entity.SystemRole;
import com.parking.backend.repository.PermissionRepository;
import com.parking.backend.repository.RolePermissionRepository;
import com.parking.backend.repository.SystemRoleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RoleService {

    private final SystemRoleRepository systemRoleRepository;
    private final PermissionRepository permissionRepository;
    private final RolePermissionRepository rolePermissionRepository;

    public List<SystemRole> getAllRoles() {
        return systemRoleRepository.findAll();
    }

    public List<Permission> getAllPermissions() {
        return permissionRepository.findAll();
    }

    public List<Integer> getPermissionsForRole(String roleCode) {
        return rolePermissionRepository.findBySystemRole_RoleCode(roleCode).stream()
                .map(rp -> rp.getPermission().getPermissionId())
                .collect(Collectors.toList());
    }

    @Transactional(rollbackFor = Exception.class)
    public void updateRolePermissions(String roleCode, RolePermissionUpdateRequest request) {
        // Anti-Lockout Validation
        if ("ROLE_ADMIN".equals(roleCode)) {
            boolean hasManagementPermission = false;
            for (Integer permId : request.getPermissionIds()) {
                Permission p = permissionRepository.findById(permId).orElse(null);
                if (p != null && "ROLE_MANAGEMENT".equals(p.getPermissionCode())) {
                    hasManagementPermission = true;
                    break;
                }
            }
            if (!hasManagementPermission) {
                throw new IllegalStateException("Anti-Lockout: Cannot remove ROLE_MANAGEMENT from ADMIN role.");
            }
        }

        rolePermissionRepository.deleteBySystemRole_RoleCode(roleCode);

        for (Integer permId : request.getPermissionIds()) {
            Permission permission = permissionRepository.findById(permId)
                    .orElseThrow(() -> new RuntimeException("Permission not found: " + permId));

            RolePermission rp = RolePermission.builder()
                    .systemRole(SystemRole.builder().roleCode(roleCode).build())
                    .permission(permission)
                    .build();
            rolePermissionRepository.save(rp);
        }
    }
}
