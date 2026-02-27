package com.pigbit.application.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record LoginTwoFactorRequest(
        @NotBlank @Email String email,
        @NotBlank String emailCode,
        String appCode
) {}
