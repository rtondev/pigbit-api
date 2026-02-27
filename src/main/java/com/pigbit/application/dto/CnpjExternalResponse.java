package com.pigbit.application.dto;

public record CnpjExternalResponse(
        String status,
        String message,
        String nome,
        String cnpj,
        String abertura,
        String natureza_juridica
) {}
