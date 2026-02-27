package com.pigbit.application.dto;

import jakarta.validation.constraints.NotBlank;

public record WalletRequest(
        @NotBlank String address,
        @NotBlank String currency
) {}
