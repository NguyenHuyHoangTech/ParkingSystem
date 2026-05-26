package com.parking.backend.repository;

import com.parking.backend.model.entity.DailyAggregatedReport;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface DailyAggregatedReportRepository extends JpaRepository<DailyAggregatedReport, Integer> {

    @Query("SELECT r FROM DailyAggregatedReport r " +
           "WHERE r.building.buildingId = :buildingId " +
           "AND r.reportDate BETWEEN :startDate AND :endDate " +
           "AND (:vehicleTypeId IS NULL OR r.vehicleType.typeId = :vehicleTypeId)")
    List<DailyAggregatedReport> findReportsByBuildingAndDateRange(
            @Param("buildingId") Integer buildingId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate,
            @Param("vehicleTypeId") Integer vehicleTypeId);
}
