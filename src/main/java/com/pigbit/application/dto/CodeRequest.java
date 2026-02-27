package com.pigbit.application.dto;

import jakarta.validation.constraints.NotBlank;

public record CodeRequest(
        @NotBlank String code
) {}
