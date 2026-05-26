package com.parking.backend.repository;

import com.parking.backend.model.entity.ParkingZone;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ParkingZoneRepository extends JpaRepository<ParkingZone, Integer> {
    List<ParkingZone> findByFloor_FloorId(Integer floorId);
}
