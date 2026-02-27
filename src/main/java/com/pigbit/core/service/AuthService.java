package com.pigbit.core.service;

import com.pigbit.application.dto.*;
import com.pigbit.application.exception.BadRequestException;
import com.pigbit.application.exception.ConflictException;
import com.pigbit.application.exception.ForbiddenException;
import com.pigbit.application.exception.NotFoundException;
import com.pigbit.application.exception.UnauthorizedException;
import com.pigbit.core.model.Company;
import com.pigbit.core.model.TermsAcceptance;
import com.pigbit.core.model.User;
import com.pigbit.infrastructure.email.EmailService;
import com.pigbit.infrastructure.integration.CnpjLookupService;
import com.pigbit.infrastructure.persistence.CompanyRepository;
import com.pigbit.infrastructure.persistence.TermsAcceptanceRepository;
import com.pigbit.infrastructure.persistence.UserRepository;
import com.pigbit.infrastructure.redis.RedisService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional
public class AuthService {
    private static final int LOGIN_CODE_LENGTH = 6;
    private static final int LOGIN_CODE_EXPIRY_MINUTES = 10;
    private static final int REGISTER_CODE_LENGTH = 6;
    private static final int REGISTER_CODE_EXPIRY_MINUTES = 30;
    private static final int MAX_LOGIN_ATTEMPTS = 3;
    private static final int LOCKOUT_MINUTES = 15;

    private final UserRepository userRepository;
    private final TermsAcceptanceRepository termsAcceptanceRepository;
    private final CompanyRepository companyRepository;
    private final CnpjLookupService cnpjLookupService;
    private final EmailService emailService;
    private final AuditLogService auditLogService;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final TwoFactorAuthService twoFactorAuthService;
    private final RedisService redisService;
    private final SecureRandom secureRandom = new SecureRandom();

    public RegisterResponse register(UserRegistrationRequest request, String ipAddress, String userAgent) {
        if (userRepository.existsByEmail(request.email())) {
            throw new ConflictException("Email já cadastrado.");
        }

        String code = generateNumericCode(REGISTER_CODE_LENGTH);
        LocalDateTime expiresAt = LocalDateTime.now().plusMinutes(REGISTER_CODE_EXPIRY_MINUTES);

        ensureRedis();
        PendingRegistrationCache cache = new PendingRegistrationCache(
                request.email(),
                passwordEncoder.encode(request.password()),
                request.taxId(),
                request.phone(),
                request.tradingName(),
                request.termsDocumentType(),
                request.termsVersion(),
                ipAddress,
                code
        );
        redisService.setJson(registerKey(request.email()), cache, Duration.ofMinutes(REGISTER_CODE_EXPIRY_MINUTES));

        sendRegistrationEmail(request.email(), code);
        auditLogService.logByEmail(request.email(), "REGISTER_REQUEST", ipAddress, userAgent, null);
        return new RegisterResponse(maskEmail(request.email()), expiresAt);
    }

    public UserResponse confirmRegistration(@Valid RegisterConfirmRequest request, String ipAddress, String userAgent) {
        ensureRedis();
        PendingRegistrationCache cache = redisService.getJson(registerKey(request.email()), PendingRegistrationCache.class)
                .orElseThrow(() -> new BadRequestException("Código inválido"));
        if (!cache.code().equals(request.code())) {
            throw new BadRequestException("Código inválido");
        }
        if (userRepository.existsByEmail(cache.email())) {
            throw new ConflictException("Email já cadastrado.");
        }

        String taxId = cache.taxId();
        String tradingName = cache.tradingName();
        String phone = cache.phone();
        String passwordHash = cache.passwordHash();
        String termsDocumentType = cache.termsDocumentType();
        String termsVersion = cache.termsVersion();
        String termsIpAddress = cache.termsIpAddress();
        String email = cache.email();

        var cnpjInfo = cnpjLookupService.lookup(taxId);
        if (cnpjInfo.legalName() == null || cnpjInfo.legalName().isBlank()) {
            throw new BadRequestException("Não foi possível validar o CNPJ");
        }

        User user = User.builder()
                .email(email)
                .passwordHash(passwordHash)
                .taxId(taxId)
                .tradingName(firstNonBlank(cnpjInfo.tradingName(), tradingName))
                .phone(phone)
                .emailVerified(true)
                .emailVerifiedAt(LocalDateTime.now())
                .twoFaEnabled(false)
                .isLocked(false)
                .build();

        User savedUser = userRepository.save(user);

        Company company = Company.builder()
                .user(savedUser)
                .taxId(taxId)
                .legalName(cnpjInfo.legalName())
                .tradingName(firstNonBlank(cnpjInfo.tradingName(), tradingName))
                .address(cnpjInfo.address())
                .businessActivityCode(cnpjInfo.businessActivityCode())
                .registrationStatus(cnpjInfo.registrationStatus())
                .build();
        companyRepository.save(company);

        TermsAcceptance acceptance = TermsAcceptance.builder()
                .user(savedUser)
                .documentType(termsDocumentType)
                .version(termsVersion)
                .ipAddress(termsIpAddress)
                .build();
        termsAcceptanceRepository.save(acceptance);

        redisService.delete(registerKey(email));
        auditLogService.log(savedUser, "REGISTER_CONFIRM", ipAddress, userAgent, null);

        return mapToResponse(savedUser);
    }

    public AuthResponse login(LoginRequest request, String ipAddress, String userAgent) {
        var user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> new UnauthorizedException("Credenciais inválidas"));

        if (!user.isEmailVerified()) {
            throw new ForbiddenException("E-mail não verificado");
        }

        enforceLoginLock(user.getEmail());

        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            registerFailedLogin(user.getEmail(), ipAddress);
            auditLogService.logByEmail(user.getEmail(), "LOGIN_FAILED", ipAddress, userAgent, null);
            throw new UnauthorizedException("Credenciais inválidas");
        }

        clearFailedLogins(user.getEmail());

        String loginCode = generateNumericCode(LOGIN_CODE_LENGTH);
        redisService.setJson(loginCodeKey(user.getEmail()),
                new LoginCodeCache(loginCode),
                Duration.ofMinutes(LOGIN_CODE_EXPIRY_MINUTES));
        sendLoginCodeEmail(user.getEmail(), loginCode);
        auditLogService.log(user, "LOGIN_EMAIL_CODE_SENT", ipAddress, userAgent, null);

        return new AuthResponse(
                null,
                "Bearer",
                true,
                user.isTwoFaEnabled(),
                mapToResponse(user)
        );
    }

    private UserResponse mapToResponse(User user) {
        return new UserResponse(
                user.getId(),
                user.getEmail(),
                user.getTaxId(),
                user.getTradingName(),
                user.isEmailVerified(),
                user.getCreatedAt()
        );
    }

    public AuthResponse loginWith2fa(LoginTwoFactorRequest req, String ipAddress, String userAgent) {
        var user = userRepository.findByEmail(req.email())
                .orElseThrow(() -> new NotFoundException("Usuário não encontrado"));

        ensureRedis();
        LoginCodeCache cache = redisService.getJson(loginCodeKey(user.getEmail()), LoginCodeCache.class)
                .orElseThrow(() -> new BadRequestException("Código inválido"));
        if (!cache.code().equals(req.emailCode())) {
            throw new BadRequestException("Código inválido");
        }
        redisService.delete(loginCodeKey(user.getEmail()));

        if (user.isTwoFaEnabled()) {
            if (req.appCode() == null || req.appCode().isBlank()) {
                throw new BadRequestException("Código 2FA obrigatório");
            }
            int appCode = parseCode(req.appCode());
            if (!twoFactorAuthService.isCodeValid(user.getTwoFaSecret(), appCode)) {
                throw new BadRequestException("Código 2FA inválido");
            }
        }

        String token = jwtService.generateToken(user.getEmail());
        auditLogService.log(user, "LOGIN_SUCCESS", ipAddress, userAgent, null);

        return new AuthResponse(
                token,
                "Bearer",
                false,
                false,
                mapToResponse(user)
        );
    }

    public void confirmPasswordReset(@Valid PasswordResetConfirmRequest req) {
        ensureRedis();
        String email = redisService.getString(resetTokenKey(req.token()))
                .orElseThrow(() -> new BadRequestException("Token inválido"));
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BadRequestException("Token inválido"));
        if (passwordEncoder.matches(req.newPassword(), user.getPasswordHash())) {
            throw new BadRequestException("Nova senha não pode ser igual à anterior");
        }
        if (user.isTwoFaEnabled()) {
            if (req.appCode() == null || req.appCode().isBlank()) {
                throw new BadRequestException("Código 2FA obrigatório");
            }
            int appCode = parseCode(req.appCode());
            if (!twoFactorAuthService.isCodeValid(user.getTwoFaSecret(), appCode)) {
                throw new BadRequestException("Código 2FA inválido");
            }
        }

        user.setPasswordHash(passwordEncoder.encode(req.newPassword()));
        userRepository.save(user);
        redisService.delete(resetTokenKey(req.token()));
        auditLogService.log(user, "PASSWORD_RESET", null, null, null);
    }

    private void enforceLoginLock(String email) {
        ensureRedis();
        Optional<String> lock = redisService.getString(lockKey(email));
        if (lock.isPresent()) {
            Long ttl = redisService.getTtlSeconds(lockKey(email));
            long minutesLeft = ttl == null ? LOCKOUT_MINUTES : Math.max(1, ttl / 60);
            throw new ForbiddenException("Conta temporariamente bloqueada. Tente novamente em " + minutesLeft + " min");
        }
    }

    private void registerFailedLogin(String email, String ipAddress) {
        ensureRedis();
        Long count = redisService.increment(failKey(email), Duration.ofMinutes(LOCKOUT_MINUTES));
        if (count != null && count >= MAX_LOGIN_ATTEMPTS) {
            redisService.setString(lockKey(email), "1", Duration.ofMinutes(LOCKOUT_MINUTES));
        }
    }

    private void clearFailedLogins(String email) {
        ensureRedis();
        redisService.delete(failKey(email));
        redisService.delete(lockKey(email));
    }

    private int parseCode(String code) {
        try {
            return Integer.parseInt(code);
        } catch (NumberFormatException ex) {
            throw new BadRequestException("Código inválido");
        }
    }

    private String generateNumericCode(int length) {
        StringBuilder builder = new StringBuilder(length);
        for (int i = 0; i < length; i++) {
            builder.append(secureRandom.nextInt(10));
        }
        return builder.toString();
    }

    private void sendRegistrationEmail(String email, String code) {
        String subject = "Pigbit: confirme seu cadastro";
        String body = "Use este codigo para confirmar seu cadastro: " + code;
        emailService.send(email, subject, body);
    }

    private void sendLoginCodeEmail(String email, String code) {
        String subject = "Pigbit: codigo de login";
        String body = "Use este codigo para continuar seu login: " + code;
        emailService.send(email, subject, body);
    }

    private String maskEmail(String email) {
        int atIndex = email.indexOf('@');
        if (atIndex <= 1) {
            return "***" + email.substring(atIndex);
        }
        String prefix = email.substring(0, 1);
        String domain = email.substring(atIndex);
        return prefix + "****" + domain;
    }

    private String firstNonBlank(String first, String second) {
        if (first != null && !first.isBlank()) {
            return first;
        }
        if (second != null && !second.isBlank()) {
            return second;
        }
        return null;
    }

    private String registerKey(String email) {
        return "register:pending:" + email.toLowerCase();
    }

    private String loginCodeKey(String email) {
        return "login:code:" + email.toLowerCase();
    }

    private String failKey(String email) {
        return "login:fail:" + email.toLowerCase();
    }

    private String lockKey(String email) {
        return "login:lock:" + email.toLowerCase();
    }

    private String resetTokenKey(String token) {
        return "reset:token:" + token;
    }

    private record PendingRegistrationCache(
            String email,
            String passwordHash,
            String taxId,
            String phone,
            String tradingName,
            String termsDocumentType,
            String termsVersion,
            String termsIpAddress,
            String code
    ) {
    }

    private record LoginCodeCache(String code) {
    }

    private void ensureRedis() {
        if (!redisService.isAvailable()) {
            throw new BadRequestException("Redis nao configurado");
        }
    }
}
