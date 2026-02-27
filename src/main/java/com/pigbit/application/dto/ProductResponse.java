package com.pigbit.application.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record ProductResponse(
        Long id,
        String name,
        String description,
        BigDecimal priceBrl,
        LocalDateTime createdAt
) {}
