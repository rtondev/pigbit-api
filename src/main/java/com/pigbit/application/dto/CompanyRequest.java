package com.pigbit.application.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record CompanyRequest(
        @NotBlank
        @Pattern(regexp = "\\d{14}", message = "CNPJ deve conter 14 dígitos")
        String taxId,
        @NotBlank String legalName,
        String tradingName,
        String address,
        String businessActivityCode
) {}
