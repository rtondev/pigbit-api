package com.pigbit.infrastructure.persistence;

import com.pigbit.core.model.Invoice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.time.LocalDateTime;
import org.springframework.data.jpa.repository.Query;

@Repository
public interface InvoiceRepository extends JpaRepository<Invoice, Long> {
    Optional<Invoice> findByPaymentId(String paymentId);
    List<Invoice> findByUserId(Long userId);
    Page<Invoice> findByUserId(Long userId, Pageable pageable);
    Optional<Invoice> findByIdAndUserId(Long id, Long userId);
    @Query("select i.paymentId from Invoice i where i.user.id = :userId")
    java.util.List<String> findPaymentIdsByUserId(Long userId);

    @Query("select coalesce(sum(i.amountBrl), 0) from Invoice i where i.user.id = :userId and i.status in ('confirmed','finished')")
    java.math.BigDecimal sumConfirmedAmountByUserId(Long userId);

    @Query("select count(i) from Invoice i where i.user.id = :userId and i.status in ('waiting','confirming')")
    long countActiveByUserId(Long userId);

    @Query("select coalesce(sum(i.amountBrl), 0) from Invoice i where i.user.id = :userId and i.createdAt >= :from and i.createdAt < :to and i.status in ('confirmed','finished')")
    java.math.BigDecimal sumConfirmedAmountBetween(Long userId, LocalDateTime from, LocalDateTime to);
}
