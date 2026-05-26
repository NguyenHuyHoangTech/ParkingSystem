package com.parking.backend.model.entity;

import jakarta.persistence.*;
import lombok.*;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.time.LocalTime;
import java.util.List;

@Entity
@org.hibernate.annotations.SQLDelete(sql = "UPDATE ParkingBuildings SET is_deleted = 1 WHERE building_id=?")
@org.hibernate.annotations.Where(clause = "is_deleted=0")
@Table(name = "ParkingBuildings")
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "manager"})
public class ParkingBuilding extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "building_id")
    private Integer buildingId;

    @Column(name = "name", nullable = false, length = 100)
    private String name;

    @Column(name = "address", nullable = false, length = 255)
    private String address;

    @Column(name = "hotline", length = 20)
    private String hotline;

    @Column(name = "latitude")
    private Double latitude;

    @Column(name = "longitude")
    private Double longitude;

    @Column(name = "open_time")
    private LocalTime openTime;

    @Column(name = "close_time")
    private LocalTime closeTime;

    @Column(name = "status", length = 20)
    private String status; // Active, Maintenance, Closed

    @Column(name = "rules_description", length = 2000)
    private String rulesDescription;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "manager_id")
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Account manager;

    @OneToMany(mappedBy = "parkingBuilding", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    @JsonIgnoreProperties("parkingBuilding")
    private List<Floor> floors;
}


