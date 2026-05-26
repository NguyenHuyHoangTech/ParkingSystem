package com.parking.backend.service;

import com.parking.backend.model.dto.ConfigUpdateRequest;
import com.parking.backend.model.entity.Account;
import com.parking.backend.model.entity.ConfigurationAuditLog;
import com.parking.backend.model.entity.SystemConfiguration;
import com.parking.backend.repository.ConfigurationAuditLogRepository;
import com.parking.backend.repository.SystemConfigurationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ConfigService {

    private final SystemConfigurationRepository configRepository;
    private final ConfigurationAuditLogRepository auditLogRepository;

    @Cacheable(value = "systemConfigs")
    public List<SystemConfiguration> getAllConfigs() {
        return configRepository.findAll();
    }

    @Transactional(rollbackFor = Exception.class)
    @CacheEvict(value = "systemConfigs", allEntries = true)
    public void updateConfigs(List<ConfigUpdateRequest> requests, Integer adminId) {
        LocalDateTime now = LocalDateTime.now();

        for (ConfigUpdateRequest req : requests) {
            SystemConfiguration config = configRepository.findById(req.getConfigKey())
                    .orElseThrow(() -> new RuntimeException("Configuration key not found: " + req.getConfigKey()));

            // Type checking
            validateDataType(req.getConfigValue(), config.getDataType());

            if (!req.getConfigValue().equals(config.getConfigValue())) {
                // Save Audit Log
                ConfigurationAuditLog auditLog = ConfigurationAuditLog.builder()
                        .configKey(config.getConfigKey())
                        .oldValue(config.getConfigValue())
                        .newValue(req.getConfigValue())
                        .changedByAccount(Account.builder().accountId(adminId).build())
                        .changedAt(now)
                        .build();
                auditLogRepository.save(auditLog);

                // Update Config
                config.setConfigValue(req.getConfigValue());
                config.setLastModifiedByAccount(Account.builder().accountId(adminId).build());
                config.setLastModifiedAt(now);
                configRepository.save(config);
            }
        }
    }

    private void validateDataType(String value, String dataType) {
        try {
            switch (dataType.toUpperCase()) {
                case "INTEGER":
                    Integer.parseInt(value);
                    break;
                case "BOOLEAN":
                    if (!value.equalsIgnoreCase("true") && !value.equalsIgnoreCase("false")) {
                        throw new IllegalArgumentException();
                    }
                    break;
                case "DOUBLE":
                    Double.parseDouble(value);
                    break;
                // STRING and JSON don't strictly fail parsing here
            }
        } catch (Exception e) {
            throw new IllegalArgumentException("Invalid data type for value: " + value + " (Expected " + dataType + ")");
        }
    }
}
