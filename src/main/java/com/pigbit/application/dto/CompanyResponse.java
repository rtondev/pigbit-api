package com.pigbit.application.dto;

public record CompanyResponse(
        Long id,
        String taxId,
        String legalName,
        String tradingName,
        String registrationStatus
) {}
