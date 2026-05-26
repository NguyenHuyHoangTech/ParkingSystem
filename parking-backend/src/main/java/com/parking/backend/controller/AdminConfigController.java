package com.parking.backend.controller;

import com.parking.backend.model.dto.ConfigUpdateRequest;
import com.parking.backend.model.entity.Account;
import com.parking.backend.model.entity.SystemConfiguration;
import com.parking.backend.repository.AccountRepository;
import com.parking.backend.service.ConfigService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/configurations")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminConfigController {

    private final ConfigService configService;
    private final AccountRepository accountRepository;

    @GetMapping
    public ResponseEntity<List<SystemConfiguration>> getAllConfigs() {
        return ResponseEntity.ok(configService.getAllConfigs());
    }

    @PutMapping
    public ResponseEntity<String> updateConfigs(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody List<ConfigUpdateRequest> requests) {
        
        Account admin = accountRepository.findByUsername(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("Admin not found"));

        configService.updateConfigs(requests, admin.getAccountId());
        return ResponseEntity.ok("Configurations updated successfully. Cache flushed.");
    }
}
