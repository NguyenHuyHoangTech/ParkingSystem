package com.parking.backend.controller;

import com.parking.backend.model.dto.FloorAllocationDTO;
import com.parking.backend.model.entity.FloorVehicleAllocation;
import com.parking.backend.service.FloorAllocationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/buildings/{buildingId}/floor-allocations")
@PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
@RequiredArgsConstructor
public class FloorAllocationController {

    private final FloorAllocationService allocationService;

    @GetMapping
    public ResponseEntity<List<FloorVehicleAllocation>> getAllocations(@PathVariable Integer buildingId) {
        return ResponseEntity.ok(allocationService.getAllocations(buildingId));
    }

    @PutMapping
    public ResponseEntity<List<FloorVehicleAllocation>> updateAllocations(
            @PathVariable Integer buildingId,
            @RequestBody @Valid List<FloorAllocationDTO> payload) {
        return ResponseEntity.ok(allocationService.updateAllocations(buildingId, payload));
    }
}
