package com.pigbit.application.dto;

import java.time.LocalDateTime;

public record TermsHistory(
        String documentType,
        String version,
        String ipAddress,
        LocalDateTime acceptedAt
) {}
