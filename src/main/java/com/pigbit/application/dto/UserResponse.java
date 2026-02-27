package com.pigbit.application.dto;

import java.time.LocalDateTime;

public record UserResponse(
        Long id,
        String email,
        String taxId,
        String tradingName,
        boolean emailVerified,
        LocalDateTime createdAt
) {}