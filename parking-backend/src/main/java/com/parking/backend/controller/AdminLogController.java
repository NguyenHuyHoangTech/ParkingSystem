package com.parking.backend.controller;

import com.parking.backend.model.entity.ConfigurationAuditLog;
import com.parking.backend.repository.ConfigurationAuditLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/admin/logs")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminLogController {

    private final ConfigurationAuditLogRepository auditLogRepository;

    @GetMapping
    public ResponseEntity<List<ConfigurationAuditLog>> getSystemLogs() {
        return ResponseEntity.ok(auditLogRepository.findAll());
    }
}
