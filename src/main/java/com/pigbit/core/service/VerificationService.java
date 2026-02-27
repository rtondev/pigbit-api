package com.pigbit.core.service;

import com.pigbit.core.model.User;
import com.pigbit.infrastructure.email.EmailService;
import com.pigbit.infrastructure.persistence.UserRepository;
import com.pigbit.infrastructure.redis.RedisService;
import com.pigbit.application.exception.BadRequestException;
import com.pigbit.application.exception.NotFoundException;
import com.pigbit.application.exception.UnauthorizedException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Duration;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Transactional
public class VerificationService {
    private static final int EMAIL_CODE_LENGTH = 6;
    private static final int RESET_TOKEN_BYTES = 32;
    private static final int EMAIL_CODE_EXPIRY_MINUTES = 30;
    private static final int RESET_CODE_EXPIRY_MINUTES = 30;

    private final UserRepository userRepository;
    private final EmailService emailService;
    private final RedisService redisService;
    private final SecureRandom secureRandom = new SecureRandom();

    public void createPasswordResetCode(String taxId) {
        userRepository.findByTaxId(taxId).ifPresent(user -> {
            ensureRedis();
            String token = generateResetToken();
            redisService.setString(resetTokenKey(token), user.getEmail(), Duration.ofMinutes(RESET_CODE_EXPIRY_MINUTES));
            sendPasswordResetEmail(user.getEmail(), token);
        });
    }

    public void sendEmailVerification() {
        User user = getCurrentUser();
        if (user.isEmailVerified()) {
            return;
        }

        String code = generateNumericCode(EMAIL_CODE_LENGTH);
        ensureRedis();
        redisService.setString(emailCodeKey(user.getId()), code, Duration.ofMinutes(EMAIL_CODE_EXPIRY_MINUTES));
        sendEmailVerification(user.getEmail(), code);
    }

    public void validateEmailCode(String code) {
        User user = getCurrentUser();
        ensureRedis();
        String cached = redisService.getString(emailCodeKey(user.getId()))
                .orElseThrow(() -> new BadRequestException("Código inválido"));
        if (!cached.equals(code)) {
            throw new BadRequestException("Código inválido");
        }
        redisService.delete(emailCodeKey(user.getId()));
        user.setEmailVerified(true);
        user.setEmailVerifiedAt(LocalDateTime.now());
        userRepository.save(user);
    }

    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()
                || authentication instanceof AnonymousAuthenticationToken) {
            throw new UnauthorizedException("Usuário não autenticado");
        }
        String email = authentication.getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new NotFoundException("Usuário não encontrado"));
    }

    private String generateNumericCode(int length) {
        StringBuilder builder = new StringBuilder(length);
        for (int i = 0; i < length; i++) {
            builder.append(secureRandom.nextInt(10));
        }
        return builder.toString();
    }

    private String generateResetToken() {
        byte[] bytes = new byte[RESET_TOKEN_BYTES];
        secureRandom.nextBytes(bytes);
        return java.util.Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private void sendPasswordResetEmail(String email, String code) {
        String subject = "Pigbit: redefinicao de senha";
        String body = "Use este codigo para redefinir sua senha: " + code;
        emailService.send(email, subject, body);
    }

    private void sendEmailVerification(String email, String code) {
        String subject = "Pigbit: verificacao de email";
        String body = "Use este codigo para verificar seu email: " + code;
        emailService.send(email, subject, body);
    }

    private String resetTokenKey(String token) {
        return "reset:token:" + token;
    }

    private String emailCodeKey(Long userId) {
        return "email:verify:" + userId;
    }

    private void ensureRedis() {
        if (!redisService.isAvailable()) {
            throw new BadRequestException("Redis nao configurado");
        }
    }
}
