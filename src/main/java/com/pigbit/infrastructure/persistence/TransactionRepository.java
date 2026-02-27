package com.pigbit.infrastructure.persistence;

import com.pigbit.core.model.Transaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, Long> {
    Optional<Transaction> findByInvoiceId(Long invoiceId);
    Optional<Transaction> findByTxHash(String txHash);
    Page<Transaction> findByInvoiceUserId(Long userId, Pageable pageable);
    Optional<Transaction> findByIdAndInvoiceUserId(Long id, Long userId);
}
