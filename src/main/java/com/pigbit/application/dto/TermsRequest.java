package com.pigbit.application.dto;

import jakarta.validation.constraints.NotBlank;

public record TermsRequest(
        @NotBlank String documentType,
        @NotBlank String version
) {}
