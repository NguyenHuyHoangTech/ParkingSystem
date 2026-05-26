package com.parking.backend.repository;

import com.parking.backend.model.entity.Gate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface GateRepository extends JpaRepository<Gate, Integer> {
    List<Gate> findByBuilding_BuildingIdAndGateTypeIn(Integer buildingId, List<String> gateTypes);
}
