package com.parking.backend.service;

import com.parking.backend.exception.BusinessRuleViolationException;
import com.parking.backend.model.dto.VehicleConfigItemDTO;
import com.parking.backend.model.entity.*;
import com.parking.backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class VehicleConfigService {

    private final BuildingVehicleConfigRepository configRepository;
    private final ParkingBuildingRepository buildingRepository;
    private final VehicleTypeRepository vehicleTypeRepository;
    private final ParkingSessionRepository sessionRepository;
    private final BookingRepository bookingRepository;

    @Transactional(rollbackFor = Exception.class)
    public List<BuildingVehicleConfig> updateVehicleConfigs(Integer buildingId, List<VehicleConfigItemDTO> payload) {
        ParkingBuilding building = buildingRepository.findById(buildingId)
                .orElseThrow(() -> new RuntimeException("Building not found"));

        // 1. Validation Logic
        for (VehicleConfigItemDTO item : payload) {
            if (!item.getIsSupported()) {
                // Check if we are disabling a vehicle type that is currently active
                long activeSessions = sessionRepository.countByVehicleType_TypeIdAndSlot_Floor_ParkingBuilding_BuildingIdAndStatus(
                        item.getVehicleTypeId(), buildingId, "IN_PROGRESS");
                long activeBookings = bookingRepository.countByVehicleType_TypeIdAndFloor_ParkingBuilding_BuildingIdAndStatusIn(
                        item.getVehicleTypeId(), buildingId, List.of("PENDING", "CONFIRMED"));

                if (activeSessions > 0 || activeBookings > 0) {
                    VehicleType vt = vehicleTypeRepository.findById(item.getVehicleTypeId()).orElse(null);
                    String typeName = vt != null ? vt.getTypeName() : "Unknown";
                    throw new BusinessRuleViolationException(
                            String.format("Không thể vô hiệu hóa Loại xe '%s'. Hiện đang có %d xe đang gửi và %d lượt đặt chỗ trước. Vui lòng giải quyết các phiên giao dịch này trước khi cập nhật cấu hình.",
                                    typeName, activeSessions, activeBookings)
                    );
                }
            }
        }

        // 2. Update BuildingVehicleConfig
        List<BuildingVehicleConfig> existingConfigs = configRepository.findByBuilding_BuildingId(buildingId);
        Map<Integer, BuildingVehicleConfig> configMap = existingConfigs.stream()
                .collect(Collectors.toMap(c -> c.getVehicleType().getTypeId(), c -> c));

        for (VehicleConfigItemDTO item : payload) {
            VehicleType vt = vehicleTypeRepository.findById(item.getVehicleTypeId())
                    .orElseThrow(() -> new RuntimeException("VehicleType not found"));

            BuildingVehicleConfig config = configMap.get(item.getVehicleTypeId());
            if (config == null) {
                config = BuildingVehicleConfig.builder()
                        .building(building)
                        .vehicleType(vt)
                        .build();
            }
            config.setMaxHeight(item.getMaxHeight());
            config.setMaxWeight(item.getMaxWeight());
            config.setIsSupported(item.getIsSupported());
            configRepository.save(config);
        }



        return configRepository.findByBuilding_BuildingId(buildingId);
    }
    
    public List<BuildingVehicleConfig> getConfigs(Integer buildingId) {
        return configRepository.findByBuilding_BuildingId(buildingId);
    }
}
