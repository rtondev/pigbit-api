package com.pigbit.application.dto;

import java.time.LocalDateTime;
import java.util.Map;

public record AuditLogResponse(
        String action,
        String ipAddress,
        String userAgent,
        Map<String, Object> metadata,
        LocalDateTime createdAt
) {}
