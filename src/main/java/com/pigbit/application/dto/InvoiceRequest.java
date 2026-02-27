package com.pigbit.application.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record InvoiceRequest(
        Long productId, // Opcional se for valor manual
        @NotNull @DecimalMin("0.01") BigDecimal amountBrl,
        @NotBlank String cryptoCurrency
) {}
