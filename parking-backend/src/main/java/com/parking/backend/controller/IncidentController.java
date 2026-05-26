package com.parking.backend.controller;

import com.parking.backend.model.dto.IncidentResolveRequestDTO;
import com.parking.backend.model.dto.IncidentResponseDTO;
import com.parking.backend.service.IncidentService;
import com.parking.backend.repository.AccountRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/incidents")
@RequiredArgsConstructor
public class IncidentController {

    private final IncidentService incidentService;
    private final AccountRepository accountRepository;

    @GetMapping("/pending")
    @PreAuthorize("hasAnyRole('STAFF', 'MANAGER', 'ADMIN')")
    public ResponseEntity<List<IncidentResponseDTO>> getPendingIncidents(
            @RequestParam Integer buildingId) {
        return ResponseEntity.ok(incidentService.getPendingIncidents(buildingId));
    }

    @PostMapping("/{incidentId}/resolve")
    @PreAuthorize("hasAnyRole('STAFF', 'MANAGER', 'ADMIN')")
    public ResponseEntity<IncidentResponseDTO> resolveIncident(
            @PathVariable Integer incidentId,
            @Valid @RequestBody IncidentResolveRequestDTO request,
            @AuthenticationPrincipal UserDetails userDetails) {

        Integer managerId = accountRepository.findByUsername(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("Account not found"))
                .getAccountId();

        IncidentResponseDTO resolved = incidentService.resolveIncident(incidentId, managerId, request);
        return ResponseEntity.ok(resolved);
    }
}
