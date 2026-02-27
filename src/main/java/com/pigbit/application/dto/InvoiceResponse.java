package com.pigbit.application.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record InvoiceResponse(
        Long id,
        String paymentId,
        BigDecimal amountBrl,
        BigDecimal amountCrypto,
        String cryptoCurrency,
        String status,
        String payAddress,
        LocalDateTime expiresAt
) {}
