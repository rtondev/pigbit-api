package com.pigbit.application.dto;

public record TwoFactorSecretResponse(
        String qrCodeUrl,
        String manualEntryKey
) {}
