package com.pigbit.application.dto;

import java.time.LocalDateTime;

public record RegisterResponse(
        String maskedEmail,
        LocalDateTime expiresAt
) {}
