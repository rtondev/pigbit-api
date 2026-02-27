package com.pigbit.application.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record WithdrawalResponse(
        Long id,
        BigDecimal amountBrl,
        BigDecimal feeApplied,
        String status,
        String txHash,
        LocalDateTime createdAt
) {}
