package com.pigbit.core.service;

import com.pigbit.application.dto.DashboardMetrics;
import com.pigbit.application.dto.TransactionResponse;
import com.pigbit.application.exception.NotFoundException;
import com.pigbit.core.model.Transaction;
import com.pigbit.infrastructure.persistence.InvoiceRepository;
import com.pigbit.infrastructure.persistence.TransactionRepository;
import com.pigbit.infrastructure.persistence.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@Transactional
public class DashboardService {
    private final InvoiceRepository invoiceRepository;
    private final TransactionRepository transactionRepository;
    private final UserRepository userRepository;

    public DashboardService(
            InvoiceRepository invoiceRepository,
            TransactionRepository transactionRepository,
            UserRepository userRepository
    ) {
        this.invoiceRepository = invoiceRepository;
        this.transactionRepository = transactionRepository;
        this.userRepository = userRepository;
    }

    public DashboardMetrics getMetrics(String userEmail) {
        Long userId = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new NotFoundException("Usuário não encontrado"))
                .getId();

        BigDecimal totalProcessed = invoiceRepository.sumConfirmedAmountByUserId(userId);
        long activeInvoices = invoiceRepository.countActiveByUserId(userId);
        BigDecimal availableBalance = totalProcessed;
        List<BigDecimal> lastSevenDays = buildLastSevenDays(userId);

        return new DashboardMetrics(totalProcessed, activeInvoices, availableBalance, lastSevenDays);
    }

    public Page<TransactionResponse> listTransactions(String userEmail, Pageable pageable) {
        Long userId = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new NotFoundException("Usuário não encontrado"))
                .getId();
        return transactionRepository.findByInvoiceUserId(userId, pageable).map(this::mapToResponse);
    }

    public TransactionResponse getTransaction(String userEmail, Long id) {
        Long userId = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new NotFoundException("Usuário não encontrado"))
                .getId();
        Transaction transaction = transactionRepository.findByIdAndInvoiceUserId(id, userId)
                .orElseThrow(() -> new NotFoundException("Transação não encontrada"));
        return mapToResponse(transaction);
    }

    private List<BigDecimal> buildLastSevenDays(Long userId) {
        List<BigDecimal> results = new ArrayList<>();
        for (int i = 6; i >= 0; i--) {
            LocalDateTime now = LocalDateTime.now();
            LocalDateTime dayStart = now.minusDays(i).toLocalDate().atStartOfDay();
            LocalDateTime dayEnd = dayStart.plusDays(1);
            BigDecimal amount = invoiceRepository.sumConfirmedAmountBetween(userId, dayStart, dayEnd);
            results.add(amount);
        }
        return results;
    }

    private TransactionResponse mapToResponse(Transaction t) {
        return new TransactionResponse(
                t.getId(),
                t.getTxHash(),
                t.getAmountBrl(),
                t.getAmountCrypto(),
                t.getStatus(),
                t.getConfirmedAt()
        );
    }
}
