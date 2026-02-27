package com.pigbit.application.dto;

public record CnpjCompanyInfo(
        String taxId,
        String legalName,
        String tradingName,
        String address,
        String businessActivityCode,
        String registrationStatus
) {}
