package com.parking.backend.repository;

import com.parking.backend.model.entity.UserFeedbackTicket;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UserFeedbackTicketRepository extends JpaRepository<UserFeedbackTicket, Integer> {
    long countByAccount_AccountIdAndStatus(Integer accountId, String status);
    List<UserFeedbackTicket> findByAccount_AccountIdOrderByCreatedAtDesc(Integer accountId);
}
