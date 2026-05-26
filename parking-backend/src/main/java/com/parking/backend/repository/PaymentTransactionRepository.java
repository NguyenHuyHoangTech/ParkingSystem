package com.parking.backend.repository;

import com.parking.backend.model.entity.PaymentTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface PaymentTransactionRepository extends JpaRepository<PaymentTransaction, Integer> {
    List<PaymentTransaction> findBySession_SessionIdAndStatusOrderByPaymentTimeDesc(Integer sessionId, String status);

    boolean existsBySession_SessionIdAndStatus(Integer sessionId, String status);

    Optional<PaymentTransaction> findByGatewayReferenceId(String gatewayReferenceId);
}
