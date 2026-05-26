package com.parking.backend.controller;

import com.parking.backend.model.dto.PricingPolicyRequestDTO;
import com.parking.backend.model.entity.PricingPolicy;
import com.parking.backend.service.PricingPolicyService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;

import java.util.List;

@RestController
@RequestMapping("/api/manager/buildings/{buildingId}/pricing-policies")
@PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
@RequiredArgsConstructor
public class PricingPolicyController {

    private final PricingPolicyService pricingPolicyService;

    @GetMapping
    public ResponseEntity<List<PricingPolicy>> getPolicies(@PathVariable Integer buildingId) {
        return ResponseEntity.ok(pricingPolicyService.getPoliciesByBuilding(buildingId));
    }

    @PostMapping
    public ResponseEntity<PricingPolicy> createPolicy(
            @PathVariable Integer buildingId,
            @Valid @RequestBody PricingPolicyRequestDTO request,
            @RequestParam(required = false, defaultValue = "false") boolean forceOverride) {
        return ResponseEntity.ok(pricingPolicyService.createPolicy(buildingId, request, forceOverride));
    }
}
