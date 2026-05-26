package com.parking.backend.model.entity;

import jakarta.persistence.*;
import lombok.*;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.util.List;

@Entity
@org.hibernate.annotations.SQLDelete(sql = "UPDATE Floors SET is_deleted = 1 WHERE floor_id=?")
@org.hibernate.annotations.Where(clause = "is_deleted=0")
@Table(name = "Floors")
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Floor extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "floor_id")
    private Integer floorId;

    @Column(name = "floor_name", nullable = false, length = 50)
    private String floorName;

    @Column(name = "status", length = 20)
    private String status; // Active, Inactive

    @Column(name = "map_cols")
    private Integer mapCols;

    @Column(name = "map_rows")
    private Integer mapRows;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "building_id", nullable = false)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    @JsonIgnoreProperties("floors")
    private ParkingBuilding parkingBuilding;

    @Column(name = "floor_order")
    private Integer floorOrder;

    @OneToMany(mappedBy = "floor", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    @JsonIgnoreProperties("floor")
    private List<Slot> slots;

    @OneToMany(mappedBy = "floor", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    @JsonIgnoreProperties("floor")
    private List<BuildingStructure> structures;

    @OneToMany(mappedBy = "floor", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    @JsonIgnoreProperties("floor")
    private List<ParkingZone> zones;
}


