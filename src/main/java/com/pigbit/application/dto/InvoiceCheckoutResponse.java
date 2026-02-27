package com.pigbit.application.dto;

import java.math.BigDecimal;

public record InvoiceCheckoutResponse(
        String paymentId,
        BigDecimal amountBrl,
        BigDecimal amountCrypto,
        String cryptoCurrency,
        String payAddress,
        Long timeoutSeconds,
        String status,
        String qrData
) {}
