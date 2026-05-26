package com.parking.backend.repository;

import com.parking.backend.model.entity.ParkingSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface ParkingSessionRepository extends JpaRepository<ParkingSession, Integer> {

    // Find active session by license plate
    @Query("SELECT p FROM ParkingSession p WHERE p.licensePlateIn = :licensePlate AND p.status = :status")
    Optional<ParkingSession> findByLicensePlateInAndStatus(@Param("licensePlate") String licensePlate, @Param("status") String status);

    // Find active session by card code
    Optional<ParkingSession> findByCardCodeAndStatus(String cardCode, String status);

    // Find active session by slot id
    Optional<ParkingSession> findBySlot_SlotIdAndStatus(Integer slotId, String status);

    // Count active sessions by floor
    long countBySlot_Floor_FloorIdAndStatus(Integer floorId, String status);

    // Find the latest completed session by plate
    @Query("SELECT p FROM ParkingSession p WHERE p.licensePlateIn = :licensePlate AND p.status = :status ORDER BY p.timeOut DESC")
    List<ParkingSession> findRecentSessionsByPlateAndStatus(@Param("licensePlate") String licensePlate, @Param("status") String status);

    // All sessions of an account
    List<ParkingSession> findByAccount_AccountId(Integer accountId);

    // Active sessions of an account (customer tracking current parking)
    List<ParkingSession> findByAccount_AccountIdAndStatus(Integer accountId, String status);

    @Query(value = "SELECT vt.type_name, COUNT(ps.session_id) as total, SUM(ps.total_fee) as revenue " +
            "FROM parking_sessions ps " +
            "JOIN vehicle_types vt ON ps.type_id = vt.type_id " +
            "WHERE ps.time_in BETWEEN :fromDate AND :toDate " +
            "AND ps.status = 'Completed' " +
            "GROUP BY vt.type_name", nativeQuery = true)
    List<Object[]> getTrafficReportByType(@Param("fromDate") String fromDate, @Param("toDate") String toDate);

    // Count active sessions by building and vehicle type
    long countByVehicleType_TypeIdAndSlot_Floor_ParkingBuilding_BuildingIdAndStatus(Integer typeId, Integer buildingId, String status);

    // Count active sessions by floor and vehicle type
    long countByVehicleType_TypeIdAndSlot_Floor_FloorIdAndStatus(Integer typeId, Integer floorId, String status);

    // Queries for Dashboard Summary (Today)
    @Query("SELECT COALESCE(SUM(p.totalFee), 0) FROM ParkingSession p WHERE p.slot.floor.parkingBuilding.buildingId = :buildingId AND CAST(p.timeIn AS date) = current_date")
    Double sumRevenueTodayByBuilding(@Param("buildingId") Integer buildingId);

    @Query("SELECT COUNT(p) FROM ParkingSession p WHERE p.slot.floor.parkingBuilding.buildingId = :buildingId AND CAST(p.timeIn AS date) = current_date")
    Integer countEntriesTodayByBuilding(@Param("buildingId") Integer buildingId);

    @Query("SELECT COUNT(p) FROM ParkingSession p WHERE p.slot.floor.parkingBuilding.buildingId = :buildingId AND CAST(p.timeOut AS date) = current_date")
    Integer countExitsTodayByBuilding(@Param("buildingId") Integer buildingId);

    @Query("SELECT COUNT(p) FROM ParkingSession p WHERE p.slot.floor.parkingBuilding.buildingId = :buildingId AND p.status = 'IN_PROGRESS'")
    Integer countInProgressByBuilding(@Param("buildingId") Integer buildingId);

    // For Daily Aggregation Job
    @Query(value = "SELECT f.building_id, ps.type_id, CAST(ps.time_in AS DATE) as report_date, " +
            "SUM(COALESCE(ps.total_fee, 0)) as total_revenue, " +
            "COUNT(ps.session_id) as total_entries " +
            "FROM parking_sessions ps " +
            "JOIN slots s ON ps.slot_id = s.slot_id " +
            "JOIN floors f ON s.floor_id = f.floor_id " +
            "WHERE CAST(ps.time_in AS DATE) = :targetDate " +
            "GROUP BY f.building_id, ps.type_id, CAST(ps.time_in AS DATE)", nativeQuery = true)
    List<Object[]> aggregateDailyData(@Param("targetDate") java.time.LocalDate targetDate);

    @Query(value = "SELECT COUNT(ps.session_id) " +
            "FROM parking_sessions ps " +
            "JOIN slots s ON ps.slot_id = s.slot_id " +
            "JOIN floors f ON s.floor_id = f.floor_id " +
            "WHERE CAST(ps.time_out AS DATE) = :targetDate " +
            "AND f.building_id = :buildingId AND ps.type_id = :typeId", nativeQuery = true)
    Integer countExitsForAggregation(@Param("buildingId") Integer buildingId, @Param("typeId") Integer typeId, @Param("targetDate") java.time.LocalDate targetDate);

    @Query(value = "SELECT TOP 1 DATEPART(HOUR, ps.time_in) as peak_hour " +
            "FROM parking_sessions ps " +
            "JOIN slots s ON ps.slot_id = s.slot_id " +
            "JOIN floors f ON s.floor_id = f.floor_id " +
            "WHERE CAST(ps.time_in AS DATE) = :targetDate " +
            "AND f.building_id = :buildingId AND ps.type_id = :typeId " +
            "GROUP BY DATEPART(HOUR, ps.time_in) " +
            "ORDER BY COUNT(ps.session_id) DESC", nativeQuery = true)
    Integer findPeakHourForAggregation(@Param("buildingId") Integer buildingId, @Param("typeId") Integer typeId, @Param("targetDate") java.time.LocalDate targetDate);

    // Queries for realtime charts
    @Query(value = "SELECT DATEPART(HOUR, ps.time_in) as hour, COUNT(ps.session_id) as entries " +
            "FROM parking_sessions ps " +
            "JOIN slots s ON ps.slot_id = s.slot_id " +
            "JOIN floors f ON s.floor_id = f.floor_id " +
            "WHERE CAST(ps.time_in AS DATE) = :targetDate " +
            "AND f.building_id = :buildingId " +
            "AND (:vehicleTypeId IS NULL OR ps.type_id = :vehicleTypeId) " +
            "GROUP BY DATEPART(HOUR, ps.time_in)", nativeQuery = true)
    List<Object[]> getTrafficTrendByHourToday(@Param("buildingId") Integer buildingId, @Param("vehicleTypeId") Integer vehicleTypeId, @Param("targetDate") java.time.LocalDate targetDate);

    @Query(value = "SELECT vt.type_name, SUM(COALESCE(ps.total_fee, 0)) as revenue " +
            "FROM parking_sessions ps " +
            "JOIN vehicle_types vt ON ps.type_id = vt.type_id " +
            "JOIN slots s ON ps.slot_id = s.slot_id " +
            "JOIN floors f ON s.floor_id = f.floor_id " +
            "WHERE CAST(ps.time_in AS DATE) = :targetDate " +
            "AND f.building_id = :buildingId " +
            "GROUP BY vt.type_name", nativeQuery = true)
    List<Object[]> getRevenueByVehicleTypeToday(@Param("buildingId") Integer buildingId, @Param("targetDate") java.time.LocalDate targetDate);
}
