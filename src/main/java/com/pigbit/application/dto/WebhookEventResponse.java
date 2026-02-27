package com.pigbit.application.dto;

import java.time.LocalDateTime;

public record WebhookEventResponse(
        String paymentId,
        boolean validSignature,
        LocalDateTime processedAt,
        LocalDateTime createdAt
) {}
