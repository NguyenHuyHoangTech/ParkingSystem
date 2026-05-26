package com.parking.backend.service;

import com.parking.backend.model.dto.IncidentResolveRequestDTO;
import com.parking.backend.model.dto.IncidentResponseDTO;
import com.parking.backend.model.dto.IncidentRequest;
import com.parking.backend.model.entity.Account;
import com.parking.backend.model.entity.ExceptionLog;
import com.parking.backend.model.entity.ParkingSession;
import com.parking.backend.model.entity.PenaltyRule;
import com.parking.backend.model.entity.Slot;
import com.parking.backend.repository.AccountRepository;
import com.parking.backend.repository.ExceptionLogRepository;
import com.parking.backend.repository.ParkingSessionRepository;
import com.parking.backend.repository.PenaltyRuleRepository;
import com.parking.backend.repository.SlotRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class IncidentServiceImpl implements IncidentService {

    private final ExceptionLogRepository exceptionLogRepository;
    private final ParkingSessionRepository sessionRepository;
    private final PenaltyRuleRepository penaltyRuleRepository;
    private final AccountRepository accountRepository;
    private final NotificationService notificationService;
    private final SlotRepository slotRepository;
    private final ObjectMapper objectMapper;

    @Override
    public List<IncidentResponseDTO> getPendingIncidents(Integer buildingId) {
        List<ExceptionLog> logs = exceptionLogRepository.findByStatusAndBuildingIdOrderByCreatedAtDesc("Pending", buildingId);
        return logs.stream().map(this::mapToDTO).collect(Collectors.toList());
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public IncidentResponseDTO resolveIncident(Integer incidentId, Integer managerId, IncidentResolveRequestDTO request) {
        ExceptionLog incident = exceptionLogRepository.findById(incidentId)
                .orElseThrow(() -> new RuntimeException("Incident not found"));
                
        if (!"Pending".equals(incident.getStatus())) {
            throw new RuntimeException("Incident is already resolved or rejected");
        }
        
        ParkingSession session = incident.getSession();
        if (session == null) {
            throw new RuntimeException("Parking session not found for this incident");
        }
        
        Account manager = accountRepository.findById(managerId)
                .orElseThrow(() -> new RuntimeException("Manager not found"));
                
        // 1. Find penalty fee
        Double fineAmount = 0.0;
        // e.g., LOST_TICKET maps to lost_card rule
        String ruleType = mapIncidentTypeToRuleType(incident.getExceptionType());
        if (ruleType != null) {
            PenaltyRule rule = penaltyRuleRepository.findByRuleType(ruleType).orElse(null);
            if (rule != null) {
                fineAmount = rule.getFineAmount();
            }
        }
        
        // 2. Update Incident
        incident.setStatus("Resolved");
        incident.setResolutionNote(request.getResolutionNote());
        incident.setFineApplied(fineAmount);
        incident.setResolvedAt(LocalDateTime.now());
        incident.setHandledBy(manager); // Resolved By
        
        // 3. Update Session
        Double currentFee = session.getTotalFee() != null ? session.getTotalFee() : 0.0;
        session.setTotalFee(currentFee + fineAmount);
        session.setIsFlagged(false); // Unlock checkout
        
        // Save
        exceptionLogRepository.save(incident);
        sessionRepository.save(session);
        
        IncidentResponseDTO responseDTO = mapToDTO(incident);
        
        // 4. Broadcast
        notificationService.broadcast("incident_resolved", responseDTO);
        
        return responseDTO;
    }

    @Override
    @Transactional
    public void reportIncident(Integer sessionId, String type, String description, String reportedBy) {
        ParkingSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Session not found"));
                
        session.setIsFlagged(true);
        sessionRepository.save(session);
        
        ExceptionLog incident = ExceptionLog.builder()
                .session(session)
                .exceptionType(type)
                .description(description)
                .reportedBy(reportedBy)
                .status("Pending")
                
                .build();
                
        incident = exceptionLogRepository.save(incident);
        
        // Broadcast
        notificationService.broadcast("new_incident", mapToDTO(incident));
    }
    
    @Override
    @Transactional(rollbackFor = Exception.class)
    public IncidentResponseDTO createIncident(IncidentRequest request, Integer staffId) {
        ParkingSession session = sessionRepository.findById(request.getSessionId())
                .orElseThrow(() -> new RuntimeException("Session not found"));

        if (!"Active".equalsIgnoreCase(session.getStatus())) {
            throw new RuntimeException("Cannot report incident on a non-active session.");
        }

        long pendingCount = exceptionLogRepository.countBySession_SessionIdAndStatus(session.getSessionId(), "Pending");
        if (pendingCount > 0) {
            throw new RuntimeException("This session already has a pending incident awaiting Manager approval.");
        }

        session.setIsFlagged(true);

        if ("WRONG_ZONE".equalsIgnoreCase(request.getIncidentType())) {
            if (request.getNewSlotId() == null) {
                throw new RuntimeException("New Slot ID is required for WRONG_ZONE incident.");
            }
            Slot newSlot = slotRepository.findById(request.getNewSlotId())
                    .orElseThrow(() -> new RuntimeException("New Slot not found"));
                    
            if (!"Available".equalsIgnoreCase(newSlot.getStatus())) {
                throw new RuntimeException("Selected slot is not available.");
            }

            Slot oldSlot = session.getSlot();
            if (oldSlot != null) {
                oldSlot.setStatus("Available");
                slotRepository.save(oldSlot);
            }

            newSlot.setStatus("Occupied");
            slotRepository.save(newSlot);
            session.setSlot(newSlot);
        }
        sessionRepository.save(session);

        Account staff = accountRepository.findById(staffId)
                .orElseThrow(() -> new RuntimeException("Staff account not found"));

        String imagesJson = null;
        if (request.getEvidenceImages() != null && !request.getEvidenceImages().isEmpty()) {
            try {
                imagesJson = objectMapper.writeValueAsString(request.getEvidenceImages());
            } catch (JsonProcessingException e) {
                throw new RuntimeException("Failed to process evidence images");
            }
        }

        ExceptionLog incident = ExceptionLog.builder()
                .session(session)
                .reportedByAccount(staff)
                .reportedBy(staff.getUsername())
                .exceptionType(request.getIncidentType())
                .description(request.getDescription())
                .evidenceImages(imagesJson)
                .status("Pending")
                
                .build();
                
        incident = exceptionLogRepository.save(incident);
        
        IncidentResponseDTO responseDTO = mapToDTO(incident);
        notificationService.broadcast("new_incident", responseDTO);
        
        return responseDTO;
    }
    
    private IncidentResponseDTO mapToDTO(ExceptionLog log) {
        String licensePlate = log.getSession() != null ? log.getSession().getLicensePlateIn() : null;
        
        return IncidentResponseDTO.builder()
                .incidentId(log.getExceptionId())
                .sessionId(log.getSession() != null ? log.getSession().getSessionId() : null)
                .exceptionType(log.getExceptionType())
                .description(log.getDescription())
                .status(log.getStatus())
                .reportedBy(log.getReportedBy())
                .createdAt(log.getCreatedAt())
                .resolvedAt(log.getResolvedAt())
                .fineApplied(log.getFineApplied())
                .resolutionNote(log.getResolutionNote())
                .carImageIn(log.getSession() != null ? log.getSession().getCarImageIn() : null)
                .carImageOut(log.getSession() != null ? log.getSession().getCarImageOut() : null)
                .licensePlate(licensePlate)
                .build();
    }
    
    private String mapIncidentTypeToRuleType(String incidentType) {
        if (incidentType == null) return null;
        return switch (incidentType) {
            case "LOST_TICKET" -> "lost_card";
            case "WRONG_ZONE" -> "wrong_zone";
            case "OVERTIME" -> "overtime";
            case "UNPAID_VEHICLE" -> "unpaid_vehicle";
            default -> null; // WRONG_PLATE doesn't necessarily have a fine, just needs override
        };
    }
}

