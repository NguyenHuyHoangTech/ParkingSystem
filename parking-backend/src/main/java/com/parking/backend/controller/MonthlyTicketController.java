package com.parking.backend.controller;

import com.parking.backend.model.dto.MonthlyTicketDTO;
import com.parking.backend.model.entity.MonthlyTicket;
import com.parking.backend.model.entity.VehicleType;
import com.parking.backend.repository.MonthlyTicketRepository;
import com.parking.backend.repository.VehicleTypeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/monthly-tickets")
@PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
public class MonthlyTicketController {

    @Autowired
    private MonthlyTicketRepository ticketRepository;

    @Autowired
    private VehicleTypeRepository vehicleTypeRepository;

    @GetMapping
    public ResponseEntity<List<MonthlyTicketDTO>> getAllTickets() {
        List<MonthlyTicketDTO> tickets = ticketRepository.findAll().stream().map(t -> MonthlyTicketDTO.builder()
                .ticketId(t.getTicketId())
                .licensePlate(t.getLicensePlate())
                .customerName(t.getCustomerName())
                .phoneNumber(t.getPhoneNumber())
                .startDate(t.getStartDate())
                .endDate(t.getEndDate())
                .vehicleTypeId(t.getVehicleType() != null ? t.getVehicleType().getTypeId() : null)
                .status(t.getStatus())
                .build()).collect(Collectors.toList());
        return ResponseEntity.ok(tickets);
    }

    @PostMapping
    public ResponseEntity<?> createTicket(@RequestBody MonthlyTicketDTO dto) {
        if (ticketRepository.findByLicensePlate(dto.getLicensePlate()).isPresent()) {
            return ResponseEntity.badRequest().body(java.util.Map.of("message", "License plate already has a monthly ticket"));
        }

        VehicleType vehicleType = null;
        if (dto.getVehicleTypeId() != null) {
            vehicleType = vehicleTypeRepository.findById(dto.getVehicleTypeId())
                    .orElseThrow(() -> new RuntimeException("Vehicle type not found"));
        }

        MonthlyTicket ticket = MonthlyTicket.builder()
                .licensePlate(dto.getLicensePlate())
                .customerName(dto.getCustomerName())
                .phoneNumber(dto.getPhoneNumber())
                .startDate(dto.getStartDate())
                .endDate(dto.getEndDate())
                .vehicleType(vehicleType)
                .status("ACTIVE")
                .build();

        MonthlyTicket saved = ticketRepository.save(ticket);
        dto.setTicketId(saved.getTicketId());
        dto.setStatus("ACTIVE");
        return ResponseEntity.ok(dto);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateTicket(@PathVariable Integer id, @RequestBody MonthlyTicketDTO dto) {
        MonthlyTicket ticket = ticketRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Ticket not found"));

        if (dto.getVehicleTypeId() != null && (ticket.getVehicleType() == null || !ticket.getVehicleType().getTypeId().equals(dto.getVehicleTypeId()))) {
            VehicleType vehicleType = vehicleTypeRepository.findById(dto.getVehicleTypeId())
                    .orElseThrow(() -> new RuntimeException("Vehicle type not found"));
            ticket.setVehicleType(vehicleType);
        }

        ticket.setLicensePlate(dto.getLicensePlate());
        ticket.setCustomerName(dto.getCustomerName());
        ticket.setPhoneNumber(dto.getPhoneNumber());
        ticket.setStartDate(dto.getStartDate());
        ticket.setEndDate(dto.getEndDate());
        ticket.setStatus(dto.getStatus());

        ticketRepository.save(ticket);
        return ResponseEntity.ok(dto);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteTicket(@PathVariable Integer id) {
        MonthlyTicket ticket = ticketRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Ticket not found"));
        ticketRepository.delete(ticket);
        return ResponseEntity.ok(java.util.Map.of("message", "Ticket deleted successfully"));
    }
}
