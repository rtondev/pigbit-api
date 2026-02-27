package com.pigbit.core.service;

import com.pigbit.application.dto.WithdrawalRequest;
import com.pigbit.application.dto.WithdrawalResponse;
import com.pigbit.core.model.User;
import com.pigbit.core.model.Wallet;
import com.pigbit.core.model.Withdrawal;
import com.pigbit.infrastructure.persistence.UserRepository;
import com.pigbit.infrastructure.persistence.WalletRepository;
import com.pigbit.infrastructure.persistence.WithdrawalRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class WithdrawalServiceTest {

    @Mock
    private WithdrawalRepository withdrawalRepository;
    @Mock
    private WalletRepository walletRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private PasswordEncoder passwordEncoder;
    @Mock
    private TwoFactorAuthService twoFactorAuthService;
    @Mock
    private AuditLogService auditLogService;

    @InjectMocks
    private WithdrawalService withdrawalService;

    @Test
    void requestWithdrawal_rejectsWrongPassword() {
        User user = User.builder().id(1L).email("user@example.com").passwordHash("hash").build();
        when(userRepository.findByEmail("user@example.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("bad", "hash")).thenReturn(false);

        RuntimeException ex = assertThrows(RuntimeException.class, () ->
                withdrawalService.requestWithdrawal(
                        new WithdrawalRequest(1L, new BigDecimal("10.00"), "bad", null),
                        "user@example.com",
                        "1.1.1.1",
                        "ua"
                )
        );
        assertEquals("Senha inválida", ex.getMessage());
        verify(withdrawalRepository, never()).save(any());
    }

    @Test
    void requestWithdrawal_requiresAppCodeWhenEnabled() {
        User user = User.builder()
                .id(1L)
                .email("user@example.com")
                .passwordHash("hash")
                .twoFaEnabled(true)
                .twoFaSecret("secret")
                .build();
        when(userRepository.findByEmail("user@example.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("ok", "hash")).thenReturn(true);

        RuntimeException ex = assertThrows(RuntimeException.class, () ->
                withdrawalService.requestWithdrawal(
                        new WithdrawalRequest(1L, new BigDecimal("10.00"), "ok", null),
                        "user@example.com",
                        "1.1.1.1",
                        "ua"
                )
        );
        assertEquals("Código 2FA obrigatório", ex.getMessage());
    }

    @Test
    void requestWithdrawal_setsSecurityAlertWhenAboveThreshold() {
        ReflectionTestUtils.setField(withdrawalService, "alertThresholdPercent", 200);
        User user = User.builder()
                .id(1L)
                .email("user@example.com")
                .passwordHash("hash")
                .build();
        Wallet wallet = Wallet.builder()
                .id(10L)
                .user(user)
                .address("addr")
                .currency("USDT")
                .build();

        when(userRepository.findByEmail("user@example.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("ok", "hash")).thenReturn(true);
        when(walletRepository.findById(10L)).thenReturn(Optional.of(wallet));
        when(withdrawalRepository.findAverageAmountByUserId(1L)).thenReturn(new BigDecimal("100.00"));
        when(withdrawalRepository.save(any(Withdrawal.class))).thenAnswer(inv -> inv.getArgument(0));

        WithdrawalResponse response = withdrawalService.requestWithdrawal(
                new WithdrawalRequest(10L, new BigDecimal("300.00"), "ok", null),
                "user@example.com",
                "1.1.1.1",
                "ua"
        );

        assertEquals(new BigDecimal("300.00"), response.amountBrl());
        ArgumentCaptor<Withdrawal> captor = ArgumentCaptor.forClass(Withdrawal.class);
        verify(withdrawalRepository).save(captor.capture());
        assertTrue(captor.getValue().isSecurityAlert());
        verify(auditLogService).log(eq(user), eq("WITHDRAWAL_REQUEST"), any(), any(), any());
    }
}
