package com.parking.backend.model.entity;

import jakarta.persistence.*;
import lombok.*;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@Entity
@Table(name = "FloorVehicleAllocations")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class FloorVehicleAllocation {

    @EmbeddedId
    private FloorVehicleAllocationId id;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("floorId")
    @JoinColumn(name = "floor_id", nullable = false)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    @JsonIgnoreProperties({"zones", "structures", "parkingBuilding"})
    private Floor floor;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("typeId")
    @JoinColumn(name = "type_id", nullable = false)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private VehicleType vehicleType;

    @Column(name = "priority_index", nullable = false)
    private Integer priorityIndex;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive;
}
