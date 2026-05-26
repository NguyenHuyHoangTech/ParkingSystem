package com.parking.backend.service;

import com.parking.backend.model.dto.SystemConfigDTO;
import com.parking.backend.model.entity.SystemConfiguration;
import com.parking.backend.repository.SystemConfigurationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Service exposing public-facing system configuration entries.
 * Only entries marked as public (isPublic = true) are returned to unauthenticated callers.
 */
@Service
@RequiredArgsConstructor
public class SystemConfigService {

    private final SystemConfigurationRepository configRepository;

    /**
     * Returns all configurations that are publicly visible.
     * (Currently all configs - extend entity with isPublic flag if needed)
     */
    public List<SystemConfigDTO> getPublicConfigs() {
        return configRepository.findAll().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    /**
     * Returns all configurations (admin use).
     */
    public List<SystemConfigDTO> getAllConfigs() {
        return configRepository.findAll().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    private SystemConfigDTO toDTO(SystemConfiguration config) {
        return SystemConfigDTO.builder()
                .configKey(config.getConfigKey())
                .configValue(config.getConfigValue())
                .dataType(config.getDataType())
                .description(config.getDescription())
                .build();
    }
}
