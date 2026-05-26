package com.parking.backend.repository;

import com.parking.backend.model.entity.ExceptionLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ExceptionLogRepository extends JpaRepository<ExceptionLog, Integer> {
    List<ExceptionLog> findByStatus(String status);
    List<ExceptionLog> findByExceptionType(String exceptionType);
    List<ExceptionLog> findBySession_SessionId(Integer sessionId);
    
    @org.springframework.data.jpa.repository.Query("SELECT e FROM ExceptionLog e WHERE e.status = :status AND e.session.slot.floor.parkingBuilding.buildingId = :buildingId ORDER BY e.createdAt DESC")
    List<ExceptionLog> findByStatusAndBuildingIdOrderByCreatedAtDesc(@org.springframework.data.repository.query.Param("status") String status, @org.springframework.data.repository.query.Param("buildingId") Integer buildingId);

    long countBySession_SessionIdAndStatus(Integer sessionId, String status);
}
