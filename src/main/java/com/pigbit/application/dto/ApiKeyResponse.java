package com.pigbit.application.dto;

import java.time.LocalDateTime;

public record ApiKeyResponse(
        Long id,
        String name,
        String keyPrefix,
        String apiKey,
        LocalDateTime createdAt,
        LocalDateTime revokedAt
) {}
