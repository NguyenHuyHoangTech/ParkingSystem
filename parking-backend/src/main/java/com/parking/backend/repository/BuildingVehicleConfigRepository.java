package com.parking.backend.repository;

import com.parking.backend.model.entity.BuildingVehicleConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BuildingVehicleConfigRepository extends JpaRepository<BuildingVehicleConfig, Integer> {
    List<BuildingVehicleConfig> findByBuilding_BuildingId(Integer buildingId);
    Optional<BuildingVehicleConfig> findByBuilding_BuildingIdAndVehicleType_TypeId(Integer buildingId, Integer typeId);
}
