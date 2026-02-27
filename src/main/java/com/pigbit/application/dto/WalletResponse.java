package com.pigbit.application.dto;

public record WalletResponse(
        Long id,
        String address,
        String currency,
        boolean isActive
) {}
