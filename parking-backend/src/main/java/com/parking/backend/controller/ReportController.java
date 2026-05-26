package com.parking.backend.controller;

import com.parking.backend.model.dto.ChartDataDTO;
import com.parking.backend.model.dto.DashboardSummaryDTO;
import com.parking.backend.service.ReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/v1/reports")
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;

    @GetMapping("/dashboard-summary")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public ResponseEntity<DashboardSummaryDTO> getDashboardSummary(
            @RequestParam Integer buildingId) {
        return ResponseEntity.ok(reportService.getDashboardSummary(buildingId));
    }

    @GetMapping("/traffic-trend")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public ResponseEntity<List<ChartDataDTO>> getTrafficTrend(
            @RequestParam Integer buildingId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) Integer vehicleTypeId) {
        return ResponseEntity.ok(reportService.getTrafficTrend(buildingId, startDate, endDate, vehicleTypeId));
    }

    @GetMapping("/revenue-distribution")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public ResponseEntity<List<ChartDataDTO>> getRevenueDistribution(
            @RequestParam Integer buildingId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        return ResponseEntity.ok(reportService.getRevenueDistribution(buildingId, startDate, endDate));
    }

    @PostMapping("/trigger-aggregation")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public ResponseEntity<?> triggerAggregation() {
        reportService.generateDailyReportJob();
        return ResponseEntity.ok(java.util.Map.of("message", "Aggregation job triggered successfully"));
    }
}
