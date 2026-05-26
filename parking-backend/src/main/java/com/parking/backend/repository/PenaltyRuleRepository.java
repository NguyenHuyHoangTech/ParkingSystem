package com.parking.backend.repository;

import com.parking.backend.model.entity.PenaltyRule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface PenaltyRuleRepository extends JpaRepository<PenaltyRule, Integer> {
    Optional<PenaltyRule> findByRuleType(String ruleType);
}
