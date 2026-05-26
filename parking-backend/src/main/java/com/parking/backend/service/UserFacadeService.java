package com.parking.backend.service;

import com.parking.backend.model.dto.BuildingDetailsResponse;
import com.parking.backend.model.dto.VehicleCapacityDTO;
import com.parking.backend.model.entity.ParkingBuilding;
import com.parking.backend.model.entity.PricingPolicy;
import com.parking.backend.model.entity.VehicleType;
import com.parking.backend.repository.ParkingBuildingRepository;
import com.parking.backend.repository.PricingPolicyRepository;
import com.parking.backend.repository.SlotRepository;
import com.parking.backend.repository.VehicleTypeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class UserFacadeService {

    private final ParkingBuildingRepository buildingRepository;
    private final SlotRepository slotRepository;
    private final PricingPolicyRepository pricingPolicyRepository;
    private final VehicleTypeRepository vehicleTypeRepository;

    @Transactional(readOnly = true)
    public List<ParkingBuilding> getAllBuildings() {
        // Expose simple building list for map markers
        return buildingRepository.findAll();
    }

    @Transactional(readOnly = true)
    public BuildingDetailsResponse getBuildingDetails(Integer buildingId) {
        ParkingBuilding building = buildingRepository.findById(buildingId)
                .orElseThrow(() -> new RuntimeException("Building not found"));

        boolean isClosedOrMaintenance = "MAINTENANCE".equalsIgnoreCase(building.getStatus()) ||
                                        "CLOSED".equalsIgnoreCase(building.getStatus());

        List<VehicleType> allTypes = vehicleTypeRepository.findAll();
        List<VehicleCapacityDTO> capacities = new ArrayList<>();

        for (VehicleType type : allTypes) {
            int total = slotRepository.countTotalByBuildingAndVehicleType(buildingId, type.getTypeId());
            int available = isClosedOrMaintenance ? 0 : slotRepository.countAvailableByBuildingAndVehicleType(buildingId, type.getTypeId());
            
            if (total > 0) { // Only show types that the building supports
                capacities.add(VehicleCapacityDTO.builder()
                        .vehicleTypeId(type.getTypeId())
                        .vehicleTypeName(type.getTypeName())
                        .totalCapacity(total)
                        .availableSlots(available)
                        .build());
            }
        }

        List<PricingPolicy> policies = pricingPolicyRepository.findByBuilding_BuildingId(buildingId);
        List<PricingPolicy> activePolicies = policies.stream().filter(p -> p.getIsActive()).toList();

        return BuildingDetailsResponse.builder()
                .buildingId(building.getBuildingId())
                .name(building.getName())
                .address(building.getAddress())
                .latitude(building.getLatitude())
                .longitude(building.getLongitude())
                .openTime(building.getOpenTime())
                .closeTime(building.getCloseTime())
                .status(building.getStatus())
                .rulesDescription(building.getRulesDescription())
                .capacities(capacities)
                .policies(activePolicies)
                .build();
    }
}
