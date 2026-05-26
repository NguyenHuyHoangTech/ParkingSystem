package com.parking.backend.model.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;

@Entity
@Table(name = "DailyAggregatedReports")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DailyAggregatedReport {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "report_id")
    private Integer reportId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "building_id", nullable = false)
    private ParkingBuilding building;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "type_id", nullable = false)
    private VehicleType vehicleType;

    @Column(name = "report_date", nullable = false)
    private LocalDate reportDate;

    @Column(name = "total_revenue")
    private Double totalRevenue;

    @Column(name = "total_entries")
    private Integer totalEntries;

    @Column(name = "total_exits")
    private Integer totalExits;

    @Column(name = "peak_hour")
    private Integer peakHour;
}
