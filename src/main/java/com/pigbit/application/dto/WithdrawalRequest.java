package com.pigbit.application.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record WithdrawalRequest(
        @NotNull Long walletId,
        @NotNull @DecimalMin("10.00") BigDecimal amountBrl,
        @NotBlank String password,
        String appCode
) {}
