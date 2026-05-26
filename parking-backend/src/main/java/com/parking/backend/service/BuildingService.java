package com.parking.backend.service;

import com.parking.backend.exception.SlotOccupiedException;
import com.parking.backend.model.dto.*;
import com.parking.backend.model.entity.*;
import com.parking.backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BuildingService {

    private final ParkingBuildingRepository buildingRepository;
    private final ParkingSessionRepository sessionRepository;
    private final VehicleTypeRepository vehicleTypeRepository;

    @Transactional(rollbackFor = Exception.class)
    public ParkingBuilding updateBuilding(Integer buildingId, BuildingUpdateDTO dto) {
        ParkingBuilding building = buildingRepository.findById(buildingId)
                .orElseThrow(() -> new RuntimeException("Building not found"));

        // Validate time
        if (!dto.isValidTime()) {
            throw new IllegalArgumentException("Thời gian đóng cửa phải lớn hơn thời gian mở cửa (Trừ khi hoạt động 24/24)");
        }

        // Gather all new/kept slot IDs from the DTO
        Set<Integer> keptSlotIds = new HashSet<>();
        if (dto.getFloors() != null) {
            for (FloorUpdateDTO floorDTO : dto.getFloors()) {
                if (floorDTO.getSlots() != null) {
                    for (SlotDTO slotDTO : floorDTO.getSlots()) {
                        if (slotDTO.getSlotId() != null) {
                            keptSlotIds.add(slotDTO.getSlotId());
                        }
                    }
                }
            }
        }

        // Check for deleted slots and active sessions
        if (building.getFloors() != null) {
            for (Floor existingFloor : building.getFloors()) {
                if (existingFloor.getSlots() != null) {
                    for (Slot existingSlot : existingFloor.getSlots()) {
                        if (!keptSlotIds.contains(existingSlot.getSlotId())) {
                            // This slot is going to be deleted (or orphaned). Check if occupied.
                            boolean isOccupied = sessionRepository.findBySlot_SlotIdAndStatus(existingSlot.getSlotId(), "IN_PROGRESS").isPresent();
                            if (isOccupied) {
                                throw new SlotOccupiedException("Không thể xóa/sửa đổi. Xe đang đỗ tại vị trí: " + existingSlot.getSlotName());
                            }
                        }
                    }
                }
            }
        }

        // Update basic building info
        building.setName(dto.getName());
        building.setAddress(dto.getAddress());
        building.setHotline(dto.getHotline());
        if (Boolean.TRUE.equals(dto.getIs24Hours())) {
            building.setOpenTime(java.time.LocalTime.MIN);
            building.setCloseTime(java.time.LocalTime.MAX);
        } else {
            building.setOpenTime(dto.getOpenTime());
            building.setCloseTime(dto.getCloseTime());
        }
        building.setStatus(dto.getStatus());

        // Update nested floors, zones, structures and slots
        if (building.getFloors() == null) {
            building.setFloors(new java.util.ArrayList<>());
        }

        if (dto.getFloors() != null) {
            java.util.List<Integer> dtoFloorIds = dto.getFloors().stream()
                    .map(FloorUpdateDTO::getFloorId)
                    .filter(java.util.Objects::nonNull)
                    .collect(java.util.stream.Collectors.toList());
            building.getFloors().removeIf(f -> f.getFloorId() != null && !dtoFloorIds.contains(f.getFloorId()));

            for (FloorUpdateDTO fDto : dto.getFloors()) {
                Floor floor = null;
                if (fDto.getFloorId() != null) {
                    floor = building.getFloors().stream()
                            .filter(f -> fDto.getFloorId().equals(f.getFloorId()))
                            .findFirst()
                            .orElse(null);
                }
                if (floor == null) {
                    floor = new Floor();
                    floor.setParkingBuilding(building);
                    building.getFloors().add(floor);
                }

                floor.setFloorName(fDto.getFloorName());
                floor.setStatus(fDto.getStatus() != null ? fDto.getStatus() : "Active");
                floor.setFloorOrder(fDto.getFloorOrder());
                floor.setMapCols(fDto.getMapCols());
                floor.setMapRows(fDto.getMapRows());

                if (floor.getStructures() == null) {
                    floor.setStructures(new java.util.ArrayList<>());
                }
                if (floor.getSlots() == null) {
                    floor.setSlots(new java.util.ArrayList<>());
                }

                // Process Structures
                if (fDto.getStructures() != null) {
                    java.util.List<Integer> dtoStructIds = fDto.getStructures().stream()
                            .map(BuildingStructureDTO::getStructureId)
                            .filter(java.util.Objects::nonNull)
                            .collect(java.util.stream.Collectors.toList());
                    floor.getStructures().removeIf(s -> s.getStructureId() != null && !dtoStructIds.contains(s.getStructureId()));

                    for (BuildingStructureDTO sDto : fDto.getStructures()) {
                        BuildingStructure structure = null;
                        if (sDto.getStructureId() != null) {
                            structure = floor.getStructures().stream()
                                    .filter(s -> sDto.getStructureId().equals(s.getStructureId()))
                                    .findFirst()
                                    .orElse(null);
                        }
                        if (structure == null) {
                            structure = new BuildingStructure();
                            structure.setFloor(floor);
                            floor.getStructures().add(structure);
                        }
                        structure.setName(sDto.getName());
                        structure.setType(sDto.getType());
                        structure.setPosX(sDto.getPosX());
                        structure.setPosY(sDto.getPosY());
                        structure.setWidth(sDto.getWidth());
                        structure.setHeight(sDto.getHeight());
                    }
                } else {
                    floor.getStructures().clear();
                }

                // Process Slots
                if (fDto.getSlots() != null) {
                    java.util.List<Integer> dtoSlotIds = fDto.getSlots().stream()
                            .map(SlotDTO::getSlotId)
                            .filter(java.util.Objects::nonNull)
                            .collect(java.util.stream.Collectors.toList());
                    floor.getSlots().removeIf(s -> s.getSlotId() != null && !dtoSlotIds.contains(s.getSlotId()));

                    for (SlotDTO sDto : fDto.getSlots()) {
                        Slot slot = null;
                        if (sDto.getSlotId() != null) {
                            slot = floor.getSlots().stream()
                                    .filter(s -> sDto.getSlotId().equals(s.getSlotId()))
                                    .findFirst()
                                    .orElse(null);
                        }
                        if (slot == null) {
                            slot = new Slot();
                            slot.setFloor(floor);
                            floor.getSlots().add(slot);
                        }

                        slot.setSlotName(sDto.getSlotName());
                        slot.setStatus(sDto.getStatus() != null ? sDto.getStatus() : "Available");
                        slot.setPosX(sDto.getPosX());
                        slot.setPosY(sDto.getPosY());
                        slot.setAllowPreBooking(sDto.getAllowPreBooking() != null ? sDto.getAllowPreBooking() : false);
                        
                        if (sDto.getTypeId() != null) {
                            VehicleType vt = vehicleTypeRepository.findById(sDto.getTypeId()).orElse(null);
                            slot.setVehicleType(vt);
                        }
                    }
                } else {
                    floor.getSlots().clear();
                }
            }
        } else {
            building.getFloors().clear();
        }

        return buildingRepository.save(building);
    }
    
    public List<ParkingBuilding> getBuildingsByManager(Integer managerId) {
        return buildingRepository.findByManagerAccountId(managerId);
    }

    public List<ParkingBuilding> getAllBuildings() {
        return buildingRepository.findAll();
    }
}
