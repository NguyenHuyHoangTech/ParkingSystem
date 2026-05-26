package com.parking.backend.controller;

import com.parking.backend.model.dto.AccountCreateRequest;
import com.parking.backend.model.dto.AccountUpdateRequest;
import com.parking.backend.model.entity.Account;
import com.parking.backend.model.entity.ParkingBuilding;
import com.parking.backend.repository.AccountRepository;
import com.parking.backend.repository.ParkingBuildingRepository;
import com.parking.backend.service.AdminService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;
    private final AccountRepository accountRepository;
    private final ParkingBuildingRepository buildingRepository;

    // ===== BUILDINGS =====
    @GetMapping("/buildings")
    public ResponseEntity<List<ParkingBuilding>> getAllBuildings() {
        return ResponseEntity.ok(buildingRepository.findAll());
    }

    // ===== USERS =====

    @GetMapping("/users")
    public ResponseEntity<List<Account>> getAllUsers() {
        return ResponseEntity.ok(adminService.getAllUsers());
    }

    @PostMapping("/users")
    public ResponseEntity<Account> createUser(@Valid @RequestBody AccountCreateRequest request) {
        return ResponseEntity.ok(adminService.createUser(request));
    }

    @PutMapping("/users/{accountId}")
    public ResponseEntity<Account> updateUser(
            @PathVariable Integer accountId,
            @RequestBody AccountUpdateRequest request) {
        return ResponseEntity.ok(adminService.updateUser(accountId, request));
    }

    @PostMapping("/users/{accountId}/suspend")
    public ResponseEntity<Map<String, String>> suspendUser(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Integer accountId,
            @RequestBody Map<String, String> body) {
        
        Account admin = accountRepository.findByUsername(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("Admin not found"));
        
        String reason = body.getOrDefault("reason", "No reason provided");
        adminService.suspendAccount(admin.getAccountId(), accountId, reason);
        return ResponseEntity.ok(Map.of("message", "User suspended successfully"));
    }
}
