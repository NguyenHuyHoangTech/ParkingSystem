package com.parking.backend.repository;

import com.parking.backend.model.entity.PricingBlock;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PricingBlockRepository extends JpaRepository<PricingBlock, Integer> {
    List<PricingBlock> findByRule_RuleId(Integer ruleId);
}
