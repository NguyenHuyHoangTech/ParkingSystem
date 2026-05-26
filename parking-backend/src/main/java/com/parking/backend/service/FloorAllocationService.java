package com.parking.backend.service;

import com.parking.backend.exception.BusinessRuleViolationException;
import com.parking.backend.model.dto.FloorAllocationDTO;
import com.parking.backend.model.entity.*;
import com.parking.backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FloorAllocationService {

    private final FloorVehicleAllocationRepository allocationRepository;
    private final FloorRepository floorRepository;
    private final VehicleTypeRepository vehicleTypeRepository;
    private final ParkingSessionRepository sessionRepository;
    private final BookingRepository bookingRepository;

    @Transactional(rollbackFor = Exception.class)
    public List<FloorVehicleAllocation> updateAllocations(Integer buildingId, List<FloorAllocationDTO> payload) {
        // 1. Validate constraints
        for (FloorAllocationDTO dto : payload) {
            if (!dto.getIsActive()) {
                long activeSessions = sessionRepository.countByVehicleType_TypeIdAndSlot_Floor_FloorIdAndStatus(
                        dto.getVehicleTypeId(), dto.getFloorId(), "IN_PROGRESS");
                
                long activeBookings = bookingRepository.countByVehicleType_TypeIdAndFloor_FloorIdAndStatusIn(
                        dto.getVehicleTypeId(), dto.getFloorId(), List.of("PENDING", "CONFIRMED"));

                if (activeSessions > 0 || activeBookings > 0) {
                    Floor floor = floorRepository.findById(dto.getFloorId()).orElse(null);
                    VehicleType vt = vehicleTypeRepository.findById(dto.getVehicleTypeId()).orElse(null);
                    
                    String floorName = floor != null ? floor.getFloorName() : "Unknown Floor";
                    String typeName = vt != null ? vt.getTypeName() : "Unknown Type";
                    
                    throw new BusinessRuleViolationException(
                            String.format("Cập nhật thất bại. Tầng '%s' hiện đang có %d %s chưa xuất bến (hoặc đã đặt trước). Vui lòng chờ xe ra hết hoặc điều hướng xe trước khi cấm loại phương tiện này.",
                                    floorName, (activeSessions + activeBookings), typeName)
                    );
                }
            }
        }

        // 2. Fetch all existing allocations for this building and set them to inactive (Soft Delete)
        List<FloorVehicleAllocation> existing = allocationRepository.findByFloor_ParkingBuilding_BuildingId(buildingId);
        for (FloorVehicleAllocation alloc : existing) {
            alloc.setIsActive(false);
        }
        allocationRepository.saveAll(existing);
        allocationRepository.flush();

        // 3. Upsert new allocations from payload
        for (FloorAllocationDTO dto : payload) {
            if (dto.getIsActive()) {
                Floor floor = floorRepository.findById(dto.getFloorId())
                        .orElseThrow(() -> new RuntimeException("Floor not found: " + dto.getFloorId()));
                VehicleType vt = vehicleTypeRepository.findById(dto.getVehicleTypeId())
                        .orElseThrow(() -> new RuntimeException("VehicleType not found: " + dto.getVehicleTypeId()));

                FloorVehicleAllocation alloc = FloorVehicleAllocation.builder()
                        .id(new FloorVehicleAllocationId(dto.getFloorId(), dto.getVehicleTypeId()))
                        .floor(floor)
                        .vehicleType(vt)
                        .priorityIndex(dto.getPriorityIndex())
                        .isActive(true)
                        .build();
                        
                allocationRepository.save(alloc);
            }
        }

        return allocationRepository.findByFloor_ParkingBuilding_BuildingId(buildingId)
                .stream().filter(FloorVehicleAllocation::getIsActive).collect(Collectors.toList());
    }

    public List<FloorVehicleAllocation> getAllocations(Integer buildingId) {
        return allocationRepository.findByFloor_ParkingBuilding_BuildingId(buildingId)
                .stream().filter(FloorVehicleAllocation::getIsActive).collect(Collectors.toList());
    }
}
