package com.parking.backend.service;

import com.parking.backend.exception.PolicyOverlapException;
import com.parking.backend.model.dto.BlockRequestDTO;
import com.parking.backend.model.dto.PricingPolicyRequestDTO;
import com.parking.backend.model.dto.VehicleRuleRequestDTO;
import com.parking.backend.model.entity.*;
import com.parking.backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PricingPolicyService {

    private final PricingPolicyRepository policyRepository;
    private final VehiclePricingRuleRepository ruleRepository;
    private final PricingBlockRepository blockRepository;
    private final ParkingBuildingRepository buildingRepository;
    private final VehicleTypeRepository vehicleTypeRepository;

    public List<PricingPolicy> getPoliciesByBuilding(Integer buildingId) {
        return policyRepository.findByBuilding_BuildingId(buildingId);
    }

    @Transactional(rollbackFor = Exception.class)
    public PricingPolicy createPolicy(Integer buildingId, PricingPolicyRequestDTO request, boolean forceOverride) {
        ParkingBuilding building = buildingRepository.findById(buildingId)
                .orElseThrow(() -> new RuntimeException("Building not found: " + buildingId));

        // Check for overlaps
        List<PricingPolicy> overlaps = policyRepository.findOverlappingActivePolicies(
                buildingId, request.getEffectiveDate(), request.getExpiryDate()
        );

        if (!overlaps.isEmpty()) {
            if (!forceOverride) {
                String overlapNames = String.join(", ", overlaps.stream().map(PricingPolicy::getPolicyName).toList());
                throw new PolicyOverlapException("Overlap with " + overlapNames);
            } else {
                // Deactivate old policies
                for (PricingPolicy oldPolicy : overlaps) {
                    oldPolicy.setIsActive(false);
                    policyRepository.save(oldPolicy);
                }
            }
        }

        PricingPolicy policy = PricingPolicy.builder()
                .building(building)
                .policyName(request.getPolicyName())
                .effectiveDate(request.getEffectiveDate())
                .expiryDate(request.getExpiryDate())
                .isActive(true)
                .build();

        PricingPolicy savedPolicy = policyRepository.save(policy);

        if (request.getRules() != null) {
            for (VehicleRuleRequestDTO ruleDto : request.getRules()) {
                VehicleType vehicleType = vehicleTypeRepository.findById(ruleDto.getVehicleTypeId())
                        .orElseThrow(() -> new RuntimeException("VehicleType not found: " + ruleDto.getVehicleTypeId()));

                VehiclePricingRule rule = VehiclePricingRule.builder()
                        .policy(savedPolicy)
                        .vehicleType(vehicleType)
                        .gracePeriodMinutes(ruleDto.getGracePeriodMinutes())
                        .maxDailyCap(ruleDto.getMaxDailyCap())
                        .lostTicketSurcharge(ruleDto.getLostTicketSurcharge())
                        .build();

                VehiclePricingRule savedRule = ruleRepository.save(rule);

                if (ruleDto.getBlocks() != null) {
                    List<PricingBlock> blocksToSave = new ArrayList<>();
                    for (BlockRequestDTO blockDto : ruleDto.getBlocks()) {
                        PricingBlock block = PricingBlock.builder()
                                .rule(savedRule)
                                .timeFrameStart(blockDto.getTimeFrameStart())
                                .timeFrameEnd(blockDto.getTimeFrameEnd())
                                .firstBlockDurationMinutes(blockDto.getFirstBlockDurationMinutes())
                                .firstBlockRate(blockDto.getFirstBlockRate())
                                .subsequentBlockDurationMinutes(blockDto.getSubsequentBlockDurationMinutes())
                                .subsequentBlockRate(blockDto.getSubsequentBlockRate())
                                .build();
                        blocksToSave.add(block);
                    }
                    blockRepository.saveAll(blocksToSave);
                }
            }
        }

        return savedPolicy;
    }
}
