package com.parking.backend.repository;

import com.parking.backend.model.entity.VehiclePricingRule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface VehiclePricingRuleRepository extends JpaRepository<VehiclePricingRule, Integer> {
    List<VehiclePricingRule> findByPolicy_PolicyId(Integer policyId);
}
