package com.pigbit.application.dto;

import lombok.Builder;

@Builder // Opcional, se quiser usar .builder() em records
public record AuthResponse(
        String token,
        String type,        // "Bearer"
        boolean emailTwoFaRequired,
        boolean appTwoFaRequired,
        UserResponse user
) {
    // Construtor compacto para definir valores padrão se desejar
    public AuthResponse {
        if (type == null) type = "Bearer";
    }
}
