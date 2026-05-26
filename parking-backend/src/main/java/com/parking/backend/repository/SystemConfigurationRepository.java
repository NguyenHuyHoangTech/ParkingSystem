package com.parking.backend.repository;

import com.parking.backend.model.entity.SystemConfiguration;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SystemConfigurationRepository extends JpaRepository<SystemConfiguration, String> {
}
