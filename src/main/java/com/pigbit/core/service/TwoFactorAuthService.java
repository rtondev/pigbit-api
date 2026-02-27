package com.pigbit.core.service;

import com.pigbit.application.dto.TwoFactorSecretResponse;
import com.pigbit.application.exception.BadRequestException;
import com.pigbit.application.exception.NotFoundException;
import com.pigbit.core.model.User;
import com.pigbit.infrastructure.persistence.UserRepository;
import com.warrenstrange.googleauth.GoogleAuthenticator;
import com.warrenstrange.googleauth.GoogleAuthenticatorKey;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@Service
@RequiredArgsConstructor
public class TwoFactorAuthService {
    private static final String ISSUER = "Pigbit";

    private final GoogleAuthenticator gAuth = new GoogleAuthenticator();
    private final UserRepository userRepository;

    public TwoFactorSecretResponse generateQrCode(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new NotFoundException("Usuário não encontrado"));

        GoogleAuthenticatorKey key = gAuth.createCredentials();
        user.setTwoFaSecret(key.getKey());
        user.setTwoFaEnabled(false);
        userRepository.save(user);

        return new TwoFactorSecretResponse(
                buildOtpAuthUrl(user.getEmail(), key.getKey()),
                key.getKey()
        );
    }

    public void enable2fa(String email, String code) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new NotFoundException("Usuário não encontrado"));

        if (user.getTwoFaSecret() == null) {
            throw new BadRequestException("2FA não foi inicializado");
        }

        int parsedCode = parseCode(code);
        if (!gAuth.authorize(user.getTwoFaSecret(), parsedCode)) {
            throw new BadRequestException("Código 2FA inválido");
        }

        user.setTwoFaEnabled(true);
        userRepository.save(user);
    }

    public void disable2fa(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new NotFoundException("Usuário não encontrado"));
        user.setTwoFaEnabled(false);
        user.setTwoFaSecret(null);
        userRepository.save(user);
    }

    public boolean isCodeValid(String secret, int code) {
        return gAuth.authorize(secret, code);
    }

    private int parseCode(String code) {
        try {
            return Integer.parseInt(code);
        } catch (NumberFormatException ex) {
            throw new BadRequestException("Código 2FA inválido");
        }
    }

    private String buildOtpAuthUrl(String email, String secret) {
        String label = urlEncode(ISSUER + ":" + email);
        String issuer = urlEncode(ISSUER);
        return "otpauth://totp/" + label + "?secret=" + secret + "&issuer=" + issuer;
    }

    private String urlEncode(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8);
    }
}
