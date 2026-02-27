package com.pigbit.infrastructure.persistence;

import com.pigbit.core.model.WebhookEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

@Repository
public interface WebhookEventRepository extends JpaRepository<WebhookEvent, Long> {
    Optional<WebhookEvent> findByPaymentId(String paymentId);
    List<WebhookEvent> findByPaymentIdInOrderByCreatedAtDesc(List<String> paymentIds);
    Page<WebhookEvent> findByPaymentIdInOrderByCreatedAtDesc(List<String> paymentIds, Pageable pageable);
}
