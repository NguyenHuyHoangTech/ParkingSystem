package com.parking.backend.repository;

import com.parking.backend.model.entity.Slot;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.Lock;
import java.util.List;
import java.util.Optional;

@Repository
public interface SlotRepository extends JpaRepository<Slot, Integer> {
    List<Slot> findByFloor_FloorId(Integer floorId);
    List<Slot> findByFloor_FloorIdAndStatus(Integer floorId, String status);
    List<Slot> findByStatus(String status);

    // Count available slots by floor
    long countByFloor_FloorIdAndStatus(Integer floorId, String status);

    List<Slot> findByFloor_ParkingBuilding_BuildingId(Integer buildingId);
    Integer countByFloor_ParkingBuilding_BuildingId(Integer buildingId);

    @Query("SELECT COUNT(s) FROM Slot s WHERE s.floor.parkingBuilding.buildingId = :buildingId AND s.vehicleType.typeId = :vehicleTypeId")
    int countTotalByBuildingAndVehicleType(@Param("buildingId") Integer buildingId, @Param("vehicleTypeId") Integer vehicleTypeId);

    @Query("SELECT COUNT(s) FROM Slot s WHERE s.floor.parkingBuilding.buildingId = :buildingId AND s.vehicleType.typeId = :vehicleTypeId AND s.status = 'Available'")
    int countAvailableByBuildingAndVehicleType(@Param("buildingId") Integer buildingId, @Param("vehicleTypeId") Integer vehicleTypeId);

    // Get first available slots in floor for staff suggestion
    @Query("SELECT s FROM Slot s WHERE s.floor.floorId = :floorId AND s.status = 'Available' ORDER BY s.posY, s.posX")
    List<Slot> findFirstAvailableInFloor(@Param("floorId") Integer floorId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT s FROM Slot s WHERE s.slotId = :slotId")
    Optional<Slot> findByIdWithPessimisticLock(@Param("slotId") Integer slotId);

    @Query("SELECT s FROM Slot s WHERE s.vehicleType.typeId = :typeId AND s.status = 'Available' " +
           "ORDER BY CASE WHEN s.floor.floorId = :floorId THEN 0 ELSE 1 END, s.posY, s.posX")
    List<Slot> findAvailableSlotByTypePreferredFloor(@Param("typeId") Integer typeId, @Param("floorId") Integer floorId);
}
