package com.parking.backend.service;

import com.parking.backend.model.dto.IncidentResolveRequestDTO;
import com.parking.backend.model.dto.IncidentResponseDTO;

import java.util.List;

public interface IncidentService {
    List<IncidentResponseDTO> getPendingIncidents(Integer buildingId);
    
    IncidentResponseDTO resolveIncident(Integer incidentId, Integer managerId, IncidentResolveRequestDTO request);
    
    // Simulates an incident creation for testing or staff action
    void reportIncident(Integer sessionId, String type, String description, String reportedBy);
    
    // Detailed Staff creation with evidence and slot swapping
    IncidentResponseDTO createIncident(com.parking.backend.model.dto.IncidentRequest request, Integer staffId);
}
