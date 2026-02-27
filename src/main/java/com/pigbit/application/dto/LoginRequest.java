package com.pigbit.application.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import org.jspecify.annotations.Nullable;

public record LoginRequest(
        @NotBlank @Email String email,
        @NotBlank String password
) {}