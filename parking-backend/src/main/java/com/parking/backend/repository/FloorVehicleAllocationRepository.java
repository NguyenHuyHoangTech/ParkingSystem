package com.parking.backend.repository;

import com.parking.backend.model.entity.FloorVehicleAllocation;
import com.parking.backend.model.entity.FloorVehicleAllocationId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FloorVehicleAllocationRepository extends JpaRepository<FloorVehicleAllocation, FloorVehicleAllocationId> {
    List<FloorVehicleAllocation> findByFloor_ParkingBuilding_BuildingId(Integer buildingId);
    List<FloorVehicleAllocation> findByVehicleType_TypeIdAndIsActiveTrueOrderByPriorityIndexAsc(Integer typeId);
    List<FloorVehicleAllocation> findByFloor_ParkingBuilding_BuildingIdAndVehicleType_TypeIdAndIsActiveTrueOrderByPriorityIndexAsc(Integer buildingId, Integer typeId);
}
