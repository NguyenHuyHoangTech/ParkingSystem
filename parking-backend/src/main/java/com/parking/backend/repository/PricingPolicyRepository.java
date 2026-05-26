package com.parking.backend.repository;

import com.parking.backend.model.entity.PricingPolicy;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface PricingPolicyRepository extends JpaRepository<PricingPolicy, Integer> {

    List<PricingPolicy> findByBuilding_BuildingId(Integer buildingId);

    @Query("SELECT p FROM PricingPolicy p WHERE p.building.buildingId = :buildingId " +
           "AND p.isActive = true " +
           "AND (p.effectiveDate <= :expiryDate OR :expiryDate IS NULL) " +
           "AND (p.expiryDate IS NULL OR p.expiryDate >= :effectiveDate)")
    List<PricingPolicy> findOverlappingActivePolicies(
            @Param("buildingId") Integer buildingId,
            @Param("effectiveDate") LocalDateTime effectiveDate,
            @Param("expiryDate") LocalDateTime expiryDate
    );
}
