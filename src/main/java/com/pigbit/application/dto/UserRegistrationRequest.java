package com.pigbit.application.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UserRegistrationRequest(
        @NotBlank(message = "O email é obrigatório")
        @Email(message = "Email inválido")
        String email,

        @NotBlank(message = "A senha é obrigatória")
        @Size(min = 8, message = "A senha deve ter no mínimo 8 caracteres")
        String password,

        @NotBlank(message = "O CPF/CNPJ é obrigatório")
        String taxId,

        String phone,
        String tradingName,

        @NotBlank(message = "Tipo de documento obrigatório")
        String termsDocumentType,
        @NotBlank(message = "Versão do documento obrigatória")
        String termsVersion
) {}
