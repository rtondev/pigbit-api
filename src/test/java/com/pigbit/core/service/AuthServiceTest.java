package com.pigbit.core.service;

import com.pigbit.application.dto.*;
import com.pigbit.core.model.*;
import com.pigbit.application.dto.CnpjCompanyInfo;
import com.pigbit.infrastructure.email.EmailService;
import com.pigbit.infrastructure.integration.CnpjLookupService;
import com.pigbit.infrastructure.persistence.*;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;
    @Mock
    private PasswordResetCodeRepository passwordResetCodeRepository;
    @Mock
    private PendingRegistrationRepository pendingRegistrationRepository;
    @Mock
    private LoginVerificationCodeRepository loginVerificationCodeRepository;
    @Mock
    private FailedLoginAttemptRepository failedLoginAttemptRepository;
    @Mock
    private TermsAcceptanceRepository termsAcceptanceRepository;
    @Mock
    private CompanyRepository companyRepository;
    @Mock
    private CnpjLookupService cnpjLookupService;
    @Mock
    private EmailService emailService;
    @Mock
    private AuditLogService auditLogService;
    @Mock
    private PasswordEncoder passwordEncoder;
    @Mock
    private JwtService jwtService;
    @Mock
    private TwoFactorAuthService twoFactorAuthService;

    @InjectMocks
    private AuthService authService;

    @Test
    void register_createsPendingAndSendsEmail() {
        UserRegistrationRequest request = new UserRegistrationRequest(
                "user@example.com",
                "Senha@123",
                "12345678000199",
                "11999990000",
                "Loja",
                "terms",
                "v1.0"
        );

        when(userRepository.existsByEmail(request.email())).thenReturn(false);
        when(pendingRegistrationRepository.findByEmail(request.email())).thenReturn(Optional.empty());
        when(passwordEncoder.encode(request.password())).thenReturn("hash");

        RegisterResponse response = authService.register(request, "127.0.0.1", "ua");

        ArgumentCaptor<PendingRegistration> captor = ArgumentCaptor.forClass(PendingRegistration.class);
        verify(pendingRegistrationRepository).save(captor.capture());
        PendingRegistration saved = captor.getValue();
        assertEquals(request.email(), saved.getEmail());
        assertEquals("hash", saved.getPasswordHash());
        assertNotNull(saved.getCode());
        assertFalse(saved.isUsed());
        assertTrue(saved.getExpiresAt().isAfter(LocalDateTime.now()));

        verify(emailService).send(eq(request.email()), contains("cadastro"), contains(saved.getCode()));
        verify(auditLogService).logByEmail(eq(request.email()), eq("REGISTER_REQUEST"), any(), any(), isNull());

        assertEquals("u****@example.com", response.maskedEmail());
        assertNotNull(response.expiresAt());
    }

    @Test
    void confirmRegistration_createsUserCompanyAndTerms() {
        PendingRegistration pending = PendingRegistration.builder()
                .email("user@example.com")
                .passwordHash("hash")
                .taxId("12345678000199")
                .tradingName("Loja")
                .termsDocumentType("terms")
                .termsVersion("v1.0")
                .termsIpAddress("127.0.0.1")
                .expiresAt(LocalDateTime.now().plusMinutes(10))
                .isUsed(false)
                .build();

        when(pendingRegistrationRepository.findByEmailAndCode("user@example.com", "123456"))
                .thenReturn(Optional.of(pending));
        when(userRepository.existsByEmail(pending.getEmail())).thenReturn(false);
        when(cnpjLookupService.lookup(pending.getTaxId()))
                .thenReturn(new CnpjCompanyInfo(pending.getTaxId(), "Razao", "Fantasia", "Rua X", "6201", "ATIVA"));
        when(userRepository.save(any(User.class))).thenAnswer(inv -> {
            User user = inv.getArgument(0);
            user.setId(1L);
            return user;
        });

        UserResponse response = authService.confirmRegistration(
                new RegisterConfirmRequest("user@example.com", "123456"),
                "127.0.0.1",
                "ua"
        );

        assertEquals("user@example.com", response.email());
        verify(companyRepository).save(any(Company.class));
        verify(termsAcceptanceRepository).save(any(TermsAcceptance.class));
        verify(pendingRegistrationRepository).save(argThat(PendingRegistration::isUsed));
        verify(auditLogService).log(any(User.class), eq("REGISTER_CONFIRM"), any(), any(), isNull());
    }

    @Test
    void login_invalidPasswordRegistersAttempt() {
        User user = User.builder()
                .email("user@example.com")
                .passwordHash("hash")
                .emailVerified(true)
                .build();

        when(userRepository.findByEmail(user.getEmail())).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("bad", "hash")).thenReturn(false);
        when(failedLoginAttemptRepository.findByEmail(user.getEmail())).thenReturn(Optional.empty());

        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> authService.login(new LoginRequest(user.getEmail(), "bad"), "1.1.1.1", "ua"));
        assertEquals("Credenciais inválidas", ex.getMessage());

        verify(failedLoginAttemptRepository).save(any(FailedLoginAttempt.class));
        verify(auditLogService).logByEmail(eq(user.getEmail()), eq("LOGIN_FAILED"), any(), any(), isNull());
    }

    @Test
    void login_successSendsEmailCode() {
        User user = User.builder()
                .email("user@example.com")
                .passwordHash("hash")
                .emailVerified(true)
                .twoFaEnabled(false)
                .build();

        when(userRepository.findByEmail(user.getEmail())).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("Senha@123", "hash")).thenReturn(true);
        when(failedLoginAttemptRepository.findByEmail(user.getEmail())).thenReturn(Optional.empty());

        AuthResponse response = authService.login(new LoginRequest(user.getEmail(), "Senha@123"), "1.1.1.1", "ua");

        assertNull(response.token());
        assertTrue(response.emailTwoFaRequired());
        assertFalse(response.appTwoFaRequired());
        verify(loginVerificationCodeRepository).save(any(LoginVerificationCode.class));
        verify(emailService).send(eq(user.getEmail()), contains("login"), anyString());
    }

    @Test
    void confirmPasswordReset_requiresValidAppCodeWhenEnabled() {
        User user = User.builder()
                .email("user@example.com")
                .passwordHash("old")
                .twoFaEnabled(true)
                .twoFaSecret("secret")
                .build();
        PasswordResetCode reset = PasswordResetCode.builder()
                .user(user)
                .code("token")
                .expiresAt(LocalDateTime.now().plusMinutes(10))
                .isUsed(false)
                .build();

        when(passwordResetCodeRepository.findByCode("token")).thenReturn(Optional.of(reset));
        when(passwordEncoder.matches("Nova@123", "old")).thenReturn(false);
        when(twoFactorAuthService.isCodeValid(eq("secret"), anyInt())).thenReturn(true);
        when(passwordEncoder.encode("Nova@123")).thenReturn("newhash");

        authService.confirmPasswordReset(new PasswordResetConfirmRequest("token", "Nova@123", "123456"));

        assertTrue(reset.isUsed());
        verify(userRepository).save(user);
        verify(passwordResetCodeRepository).save(reset);
        verify(auditLogService).log(eq(user), eq("PASSWORD_RESET"), isNull(), isNull(), isNull());
    }
}
