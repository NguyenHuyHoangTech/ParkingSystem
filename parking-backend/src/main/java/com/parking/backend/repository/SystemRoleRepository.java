package com.parking.backend.repository;

import com.parking.backend.model.entity.SystemRole;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SystemRoleRepository extends JpaRepository<SystemRole, String> {
}
