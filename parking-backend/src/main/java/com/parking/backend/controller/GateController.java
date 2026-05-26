package com.parking.backend.controller;

import com.parking.backend.model.dto.GateDTO;
import com.parking.backend.model.entity.Gate;
import com.parking.backend.model.entity.ParkingBuilding;
import com.parking.backend.repository.GateRepository;
import com.parking.backend.repository.ParkingBuildingRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/gates")
@PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
public class GateController {

    @Autowired
    private GateRepository gateRepository;

    @Autowired
    private ParkingBuildingRepository parkingBuildingRepository;

    @GetMapping
    public ResponseEntity<List<GateDTO>> getAllGates() {
        List<GateDTO> gates = gateRepository.findAll().stream().map(g -> GateDTO.builder()
                .gateId(g.getGateId())
                .gateName(g.getGateName())
                .gateType(g.getGateType())
                .buildingId(g.getBuilding() != null ? g.getBuilding().getBuildingId() : null)
                .build()).collect(Collectors.toList());
        return ResponseEntity.ok(gates);
    }

    @PostMapping
    public ResponseEntity<GateDTO> createGate(@RequestBody GateDTO dto) {
        ParkingBuilding building = null;
        if (dto.getBuildingId() != null) {
            building = parkingBuildingRepository.findById(dto.getBuildingId())
                    .orElseThrow(() -> new RuntimeException("Building not found"));
        }

        Gate gate = new Gate();
        gate.setGateName(dto.getGateName());
        gate.setGateType(dto.getGateType());
        gate.setBuilding(building);

        Gate saved = gateRepository.save(gate);
        dto.setGateId(saved.getGateId());
        return ResponseEntity.ok(dto);
    }

    @PutMapping("/{id}")
    public ResponseEntity<GateDTO> updateGate(@PathVariable Integer id, @RequestBody GateDTO dto) {
        Gate gate = gateRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Gate not found"));

        if (dto.getBuildingId() != null && (gate.getBuilding() == null || !gate.getBuilding().getBuildingId().equals(dto.getBuildingId()))) {
            ParkingBuilding building = parkingBuildingRepository.findById(dto.getBuildingId())
                    .orElseThrow(() -> new RuntimeException("Building not found"));
            gate.setBuilding(building);
        }

        gate.setGateName(dto.getGateName());
        gate.setGateType(dto.getGateType());

        gateRepository.save(gate);
        dto.setGateId(id);
        return ResponseEntity.ok(dto);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteGate(@PathVariable Integer id) {
        Gate gate = gateRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Gate not found"));
        gateRepository.delete(gate);
        return ResponseEntity.ok(java.util.Map.of("message", "Gate deleted successfully"));
    }
}
