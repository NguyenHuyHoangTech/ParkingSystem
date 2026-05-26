package com.parking.backend.controller;

import com.parking.backend.model.dto.BuildingUpdateDTO;
import com.parking.backend.model.entity.Account;
import com.parking.backend.model.entity.ParkingBuilding;
import com.parking.backend.repository.AccountRepository;
import com.parking.backend.service.BuildingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/buildings")
@RequiredArgsConstructor
public class BuildingController {

    private final BuildingService buildingService;
    private final AccountRepository accountRepository;

    @GetMapping
    public ResponseEntity<List<ParkingBuilding>> getBuildings(Authentication authentication) {
        String username = authentication.getName();
        Account account = accountRepository.findByUsername(username).orElse(null);
        if (account == null) {
            return ResponseEntity.status(401).build();
        }
        
        // If Admin, get all buildings. For Manager, only their buildings.
        if ("ROLE_ADMIN".equalsIgnoreCase(account.getRole()) || "Admin".equalsIgnoreCase(account.getRole())) {
            return ResponseEntity.ok(buildingService.getAllBuildings());
        }
        
        return ResponseEntity.ok(buildingService.getBuildingsByManager(account.getAccountId()));
    }

    @PutMapping("/{buildingId}")
    public ResponseEntity<ParkingBuilding> updateBuilding(
            @PathVariable Integer buildingId,
            @Valid @RequestBody BuildingUpdateDTO dto) {
        
        ParkingBuilding updated = buildingService.updateBuilding(buildingId, dto);
        return ResponseEntity.ok(updated);
    }
}
