package com.pigbit.application.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record PasswordResetRequest(
        @NotBlank
        @Pattern(regexp = "\\d{10}", message = "CNPJ deve conter 14 dígitos")
        String taxId
) {}
