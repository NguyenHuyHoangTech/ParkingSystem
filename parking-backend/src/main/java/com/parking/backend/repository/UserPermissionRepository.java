package com.parking.backend.repository;

import com.parking.backend.model.entity.UserPermission;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface UserPermissionRepository extends JpaRepository<UserPermission, Integer> {
    List<UserPermission> findByAccount_AccountId(Integer accountId);
    void deleteByAccount_AccountId(Integer accountId);
}
