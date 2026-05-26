package com.parking.backend.repository;

import com.parking.backend.model.entity.BuildingStructure;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BuildingStructureRepository extends JpaRepository<BuildingStructure, Integer> {
    List<BuildingStructure> findByFloor_FloorId(Integer floorId);
}
