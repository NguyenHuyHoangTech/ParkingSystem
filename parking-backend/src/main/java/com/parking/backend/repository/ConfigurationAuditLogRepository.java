package com.parking.backend.repository;

import com.parking.backend.model.entity.ConfigurationAuditLog;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ConfigurationAuditLogRepository extends JpaRepository<ConfigurationAuditLog, Integer> {
}
