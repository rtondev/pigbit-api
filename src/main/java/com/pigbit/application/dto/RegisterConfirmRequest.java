package com.pigbit.application.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record RegisterConfirmRequest(
        @NotBlank @Email String email,
        @NotBlank String code
) {}
