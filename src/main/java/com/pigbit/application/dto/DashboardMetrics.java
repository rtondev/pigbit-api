package com.pigbit.application.dto;

import java.math.BigDecimal;
import java.util.List;

public record DashboardMetrics(
        BigDecimal totalProcessedBrl,
        Long activeInvoicesCount,
        BigDecimal availableBalanceBrl,
        List<BigDecimal> lastSevenDaysVolume
) {}
