package com.pigbit.application.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record TransactionResponse(
        Long id,
        String txHash,
        BigDecimal amountBrl,
        BigDecimal amountCrypto,
        String status,
        LocalDateTime confirmedAt
) {}
