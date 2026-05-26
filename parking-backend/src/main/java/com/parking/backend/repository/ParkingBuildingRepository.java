package com.parking.backend.repository;

import com.parking.backend.model.entity.ParkingBuilding;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ParkingBuildingRepository extends JpaRepository<ParkingBuilding, Integer> {
    
    // Find building by manager account id
    List<ParkingBuilding> findByManagerAccountId(Integer managerId);
    
    // Optionally we can add a method to get active building
    Optional<ParkingBuilding> findFirstByStatus(String status);
}
