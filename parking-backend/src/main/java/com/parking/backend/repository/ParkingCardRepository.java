package com.parking.backend.repository;

import com.parking.backend.model.entity.ParkingCard;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ParkingCardRepository extends JpaRepository<ParkingCard, Integer> {
    Optional<ParkingCard> findByCardCode(String cardCode);
    Optional<ParkingCard> findByCardCodeAndStatus(String cardCode, String status);
}
