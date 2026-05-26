package com.parking.backend.service;

import com.parking.backend.model.dto.ChartDataDTO;
import com.parking.backend.model.dto.DashboardSummaryDTO;

import java.time.LocalDate;
import java.util.List;

public interface ReportService {
    DashboardSummaryDTO getDashboardSummary(Integer buildingId);
    
    List<ChartDataDTO> getTrafficTrend(Integer buildingId, LocalDate startDate, LocalDate endDate, Integer vehicleTypeId);
    
    List<ChartDataDTO> getRevenueDistribution(Integer buildingId, LocalDate startDate, LocalDate endDate);
    
    void generateDailyReportJob();
}
