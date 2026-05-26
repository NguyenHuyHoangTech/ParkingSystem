package com.parking.backend.repository;

import com.parking.backend.model.entity.MonthlyTicket;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface MonthlyTicketRepository extends JpaRepository<MonthlyTicket, Integer> {
    Optional<MonthlyTicket> findByLicensePlate(String licensePlate);
}
