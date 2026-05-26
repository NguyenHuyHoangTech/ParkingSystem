package com.parking.backend.model.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.util.Objects;

@Embeddable
@Data
@NoArgsConstructor
@AllArgsConstructor
public class FloorVehicleAllocationId implements Serializable {

    @Column(name = "floor_id")
    private Integer floorId;

    @Column(name = "type_id")
    private Integer typeId;

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        FloorVehicleAllocationId that = (FloorVehicleAllocationId) o;
        return Objects.equals(floorId, that.floorId) &&
               Objects.equals(typeId, that.typeId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(floorId, typeId);
    }
}
