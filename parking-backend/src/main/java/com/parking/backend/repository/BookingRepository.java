package com.parking.backend.repository;

import com.parking.backend.model.entity.Booking;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface BookingRepository extends JpaRepository<Booking, Integer> {
    List<Booking> findByAccount_AccountId(Integer accountId);
    List<Booking> findByAccount_AccountIdAndStatus(Integer accountId, String status);
    List<Booking> findByLicensePlateAndStatusIn(String licensePlate, List<String> statuses);
    List<Booking> findBySlot_SlotIdAndStatusIn(Integer slotId, List<String> statuses);
    // Check if slot has active booking
    List<Booking> findBySlot_SlotIdAndStatusInAndStartTimeLessThanAndEndTimeGreaterThan(
        Integer slotId, List<String> statuses, LocalDateTime endTime, LocalDateTime startTime);
        
    // Count active bookings by building and vehicle type
    long countByVehicleType_TypeIdAndFloor_ParkingBuilding_BuildingIdAndStatusIn(Integer typeId, Integer buildingId, List<String> statuses);

    // Count active bookings by floor and vehicle type
    long countByVehicleType_TypeIdAndFloor_FloorIdAndStatusIn(Integer typeId, Integer floorId, List<String> statuses);

    // Count overlapping bookings in a Floor
    @Query("SELECT COUNT(b) FROM Booking b WHERE b.floor.floorId = :floorId AND b.status IN :statuses " +
           "AND b.startTime < :endTime AND b.endTime > :startTime")
    Integer countOverlappingBookingsInFloor(@org.springframework.data.repository.query.Param("floorId") Integer floorId, 
                                            @org.springframework.data.repository.query.Param("statuses") List<String> statuses, 
                                            @org.springframework.data.repository.query.Param("startTime") LocalDateTime startTime, 
                                            @org.springframework.data.repository.query.Param("endTime") LocalDateTime endTime);
}
