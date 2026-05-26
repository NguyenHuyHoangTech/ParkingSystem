package com.parking.backend.service;

import com.parking.backend.model.dto.ChartDataDTO;
import com.parking.backend.model.dto.DashboardSummaryDTO;
import com.parking.backend.model.entity.DailyAggregatedReport;
import com.parking.backend.model.entity.ParkingBuilding;
import com.parking.backend.model.entity.VehicleType;
import com.parking.backend.repository.DailyAggregatedReportRepository;
import com.parking.backend.repository.ParkingBuildingRepository;
import com.parking.backend.repository.ParkingSessionRepository;
import com.parking.backend.repository.SlotRepository;
import com.parking.backend.repository.VehicleTypeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReportServiceImpl implements ReportService {

    private final ParkingSessionRepository sessionRepository;
    private final DailyAggregatedReportRepository reportRepository;
    private final SlotRepository slotRepository;
    private final ParkingBuildingRepository buildingRepository;
    private final VehicleTypeRepository vehicleTypeRepository;

    @Override
    @Transactional(readOnly = true)
    public DashboardSummaryDTO getDashboardSummary(Integer buildingId) {
        Double revenue = sessionRepository.sumRevenueTodayByBuilding(buildingId);
        Integer entries = sessionRepository.countEntriesTodayByBuilding(buildingId);
        Integer exits = sessionRepository.countExitsTodayByBuilding(buildingId);
        Integer inProgress = sessionRepository.countInProgressByBuilding(buildingId);
        
        // Total slots in building
        Integer totalCapacity = slotRepository.countByFloor_ParkingBuilding_BuildingId(buildingId);
        
        Double occupancyRate = 0.0;
        if (totalCapacity != null && totalCapacity > 0 && inProgress != null) {
            occupancyRate = (inProgress.doubleValue() / totalCapacity) * 100;
        }

        return DashboardSummaryDTO.builder()
                .totalRevenue(revenue != null ? revenue : 0.0)
                .totalEntries(entries != null ? entries : 0)
                .totalExits(exits != null ? exits : 0)
                .occupancyRate(Math.round(occupancyRate * 10.0) / 10.0)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public List<ChartDataDTO> getTrafficTrend(Integer buildingId, LocalDate startDate, LocalDate endDate, Integer vehicleTypeId) {
        List<ChartDataDTO> result = new ArrayList<>();
        
        if (startDate.isEqual(endDate) && startDate.isEqual(LocalDate.now())) {
            // Realtime data for today
            List<Object[]> rawData = sessionRepository.getTrafficTrendByHourToday(buildingId, vehicleTypeId, startDate);
            for (Object[] row : rawData) {
                Integer hour = (Integer) row[0];
                Integer entries = ((Number) row[1]).intValue();
                result.add(ChartDataDTO.builder()
                        .name(hour + ":00")
                        .entries(entries)
                        .exits(0) // Simplified for realtime hour graph
                        .build());
            }
        } else {
            // Historical data from Aggregated Reports
            List<DailyAggregatedReport> reports = reportRepository.findReportsByBuildingAndDateRange(buildingId, startDate, endDate, vehicleTypeId);
            
            // Group by date
            var grouped = reports.stream().collect(Collectors.groupingBy(DailyAggregatedReport::getReportDate));
            
            grouped.forEach((date, dailyReports) -> {
                int totalEntries = dailyReports.stream().mapToInt(r -> r.getTotalEntries() != null ? r.getTotalEntries() : 0).sum();
                int totalExits = dailyReports.stream().mapToInt(r -> r.getTotalExits() != null ? r.getTotalExits() : 0).sum();
                
                result.add(ChartDataDTO.builder()
                        .name(date.toString())
                        .entries(totalEntries)
                        .exits(totalExits)
                        .build());
            });
            // Sort by date name
            result.sort((a, b) -> a.getName().compareTo(b.getName()));
        }
        
        return result;
    }

    @Override
    @Transactional(readOnly = true)
    public List<ChartDataDTO> getRevenueDistribution(Integer buildingId, LocalDate startDate, LocalDate endDate) {
        List<ChartDataDTO> result = new ArrayList<>();
        
        if (startDate.isEqual(endDate) && startDate.isEqual(LocalDate.now())) {
             // Realtime data for today
            List<Object[]> rawData = sessionRepository.getRevenueByVehicleTypeToday(buildingId, startDate);
            for (Object[] row : rawData) {
                String typeName = (String) row[0];
                Double revenue = ((Number) row[1]).doubleValue();
                result.add(ChartDataDTO.builder()
                        .name(typeName)
                        .value(revenue)
                        .build());
            }
        } else {
            // Historical data
            List<DailyAggregatedReport> reports = reportRepository.findReportsByBuildingAndDateRange(buildingId, startDate, endDate, null);
            var grouped = reports.stream().collect(Collectors.groupingBy(r -> r.getVehicleType().getTypeName()));
            
            grouped.forEach((typeName, dailyReports) -> {
                double totalRevenue = dailyReports.stream().mapToDouble(r -> r.getTotalRevenue() != null ? r.getTotalRevenue() : 0.0).sum();
                result.add(ChartDataDTO.builder()
                        .name(typeName)
                        .value(totalRevenue)
                        .build());
            });
        }
        
        return result;
    }

    @Override
    @Transactional
    @Scheduled(cron = "0 5 0 * * ?") // 00:05 AM every day
    public void generateDailyReportJob() {
        LocalDate yesterday = LocalDate.now().minusDays(1);
        
        // 1. Aggregate from ParkingSessions
        List<Object[]> aggregatedData = sessionRepository.aggregateDailyData(yesterday);
        
        List<DailyAggregatedReport> newReports = new ArrayList<>();
        
        for (Object[] row : aggregatedData) {
            Integer buildingId = (Integer) row[0];
            Integer typeId = (Integer) row[1];
            Double totalRevenue = ((Number) row[3]).doubleValue();
            Integer totalEntries = ((Number) row[4]).intValue();
            
            Integer totalExits = sessionRepository.countExitsForAggregation(buildingId, typeId, yesterday);
            Integer peakHour = sessionRepository.findPeakHourForAggregation(buildingId, typeId, yesterday);
            
            ParkingBuilding building = buildingRepository.findById(buildingId).orElse(null);
            VehicleType vehicleType = vehicleTypeRepository.findById(typeId).orElse(null);
            
            if (building != null && vehicleType != null) {
                newReports.add(DailyAggregatedReport.builder()
                        .building(building)
                        .vehicleType(vehicleType)
                        .reportDate(yesterday)
                        .totalRevenue(totalRevenue)
                        .totalEntries(totalEntries)
                        .totalExits(totalExits != null ? totalExits : 0)
                        .peakHour(peakHour != null ? peakHour : 0)
                        .build());
            }
        }
        
        if (!newReports.isEmpty()) {
            reportRepository.saveAll(newReports);
        }
    }
}
