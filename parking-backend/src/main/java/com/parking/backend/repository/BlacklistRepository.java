package com.parking.backend.repository;

import com.parking.backend.model.entity.Blacklist;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface BlacklistRepository extends JpaRepository<Blacklist, Integer> {
    boolean existsByLicensePlate(String licensePlate);
}
