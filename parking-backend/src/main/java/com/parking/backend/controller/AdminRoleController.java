package com.parking.backend.controller;

import com.parking.backend.model.dto.RolePermissionUpdateRequest;
import com.parking.backend.model.entity.Permission;
import com.parking.backend.model.entity.SystemRole;
import com.parking.backend.service.RoleService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/roles")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminRoleController {

    private final RoleService roleService;

    @GetMapping
    public ResponseEntity<List<SystemRole>> getAllRoles() {
        return ResponseEntity.ok(roleService.getAllRoles());
    }

    @GetMapping("/permissions")
    public ResponseEntity<List<Permission>> getAllPermissions() {
        return ResponseEntity.ok(roleService.getAllPermissions());
    }

    @GetMapping("/{roleCode}/permissions")
    public ResponseEntity<List<Integer>> getPermissionsForRole(@PathVariable String roleCode) {
        return ResponseEntity.ok(roleService.getPermissionsForRole(roleCode));
    }

    @PutMapping("/{roleCode}/permissions")
    public ResponseEntity<String> updateRolePermissions(
            @PathVariable String roleCode,
            @RequestBody RolePermissionUpdateRequest request) {
        roleService.updateRolePermissions(roleCode, request);
        return ResponseEntity.ok("Permissions updated successfully.");
    }
}
