package com.parking.backend.controller;

import com.parking.backend.model.dto.VehicleConfigItemDTO;
import com.parking.backend.model.entity.BuildingVehicleConfig;
import com.parking.backend.service.VehicleConfigService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/buildings/{buildingId}/vehicle-configs")
@PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
@RequiredArgsConstructor
public class VehicleConfigController {

    private final VehicleConfigService configService;

    @GetMapping
    public ResponseEntity<List<BuildingVehicleConfig>> getConfigs(@PathVariable Integer buildingId) {
        return ResponseEntity.ok(configService.getConfigs(buildingId));
    }

    @PutMapping
    public ResponseEntity<List<BuildingVehicleConfig>> updateConfigs(
            @PathVariable Integer buildingId,
            @RequestBody @Valid List<VehicleConfigItemDTO> payload) {
        return ResponseEntity.ok(configService.updateVehicleConfigs(buildingId, payload));
    }
}
