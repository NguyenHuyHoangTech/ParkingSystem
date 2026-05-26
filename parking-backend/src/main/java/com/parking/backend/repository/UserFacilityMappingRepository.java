package com.parking.backend.repository;

import com.parking.backend.model.entity.UserFacilityMapping;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.List;

@Repository
public interface UserFacilityMappingRepository extends JpaRepository<UserFacilityMapping, Integer> {
    Optional<UserFacilityMapping> findByAccount_AccountId(Integer accountId);
    List<UserFacilityMapping> findByBuilding_BuildingId(Integer buildingId);
    void deleteByAccount_AccountId(Integer accountId);
}
