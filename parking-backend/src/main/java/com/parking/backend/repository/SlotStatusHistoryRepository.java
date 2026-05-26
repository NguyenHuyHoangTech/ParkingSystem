package com.parking.backend.repository;

import com.parking.backend.model.entity.SlotStatusHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SlotStatusHistoryRepository extends JpaRepository<SlotStatusHistory, Integer> {
}
