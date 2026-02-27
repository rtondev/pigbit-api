package com.pigbit.core.service;

import com.pigbit.application.dto.WithdrawalRequest;
import com.pigbit.application.dto.WithdrawalResponse;
import com.pigbit.application.exception.BadRequestException;
import com.pigbit.application.exception.NotFoundException;
import com.pigbit.application.exception.UnauthorizedException;
import com.pigbit.core.model.User;
import com.pigbit.core.model.Wallet;
import com.pigbit.core.model.Withdrawal;
import com.pigbit.infrastructure.persistence.InvoiceRepository;
import com.pigbit.infrastructure.persistence.UserRepository;
import com.pigbit.infrastructure.persistence.WalletRepository;
import com.pigbit.infrastructure.persistence.WithdrawalRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

@Service
@RequiredArgsConstructor
@Transactional
public class WithdrawalService {

    private final WithdrawalRepository withdrawalRepository;
    private final WalletRepository walletRepository;
    private final InvoiceRepository invoiceRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final TwoFactorAuthService twoFactorAuthService;
    private final AuditLogService auditLogService;

    @Value("${withdrawal.alert-threshold-percent:200}")
    private int alertThresholdPercent;

    public WithdrawalResponse requestWithdrawal(WithdrawalRequest request, String userEmail, String ipAddress, String userAgent) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new NotFoundException("Usuário não encontrado"));

        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new UnauthorizedException("Senha inválida");
        }

        if (user.isTwoFaEnabled()) {
            if (request.appCode() == null || request.appCode().isBlank()) {
                throw new BadRequestException("Código 2FA obrigatório");
            }
            int code;
            try {
                code = Integer.parseInt(request.appCode());
            } catch (NumberFormatException ex) {
                throw new BadRequestException("Código 2FA inválido");
            }
            if (!twoFactorAuthService.isCodeValid(user.getTwoFaSecret(), code)) {
                throw new BadRequestException("Código 2FA inválido");
            }
        }

        Wallet wallet = walletRepository.findById(request.walletId())
                .filter(w -> w.getUser().getId().equals(user.getId()))
                .orElseThrow(() -> new NotFoundException("Carteira não encontrada ou inválida"));

        if (!wallet.isActive()) {
            throw new BadRequestException("Carteira inativa");
        }

        java.math.BigDecimal totalProcessed = invoiceRepository.sumConfirmedAmountByUserId(user.getId());
        java.math.BigDecimal totalWithdrawn = withdrawalRepository.sumTotalByUserId(user.getId());
        java.math.BigDecimal available = totalProcessed.subtract(totalWithdrawn);
        if (request.amountBrl().compareTo(available) > 0) {
            throw new BadRequestException("Saldo insuficiente");
        }

        boolean securityAlert = isSecurityAlert(user.getId(), request.amountBrl());

        Withdrawal withdrawal = Withdrawal.builder()
                .user(wallet.getUser())
                .wallet(wallet)
                .amountBrl(request.amountBrl())
                .status("PENDING")
                .securityAlert(securityAlert)
                .build();

        Withdrawal saved = withdrawalRepository.save(withdrawal);
        auditLogService.log(user, "WITHDRAWAL_REQUEST", ipAddress, userAgent,
                java.util.Map.of("amountBrl", request.amountBrl(), "alert", securityAlert));
        return mapToResponse(saved);
    }

    public List<WithdrawalResponse> list(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new NotFoundException("Usuário não encontrado"));
        return withdrawalRepository.findByUserId(user.getId()).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public Page<WithdrawalResponse> list(String userEmail, Pageable pageable) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new NotFoundException("Usuário não encontrado"));
        return withdrawalRepository.findByUserId(user.getId(), pageable)
                .map(this::mapToResponse);
    }

    public WithdrawalResponse getById(String userEmail, Long id) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new NotFoundException("Usuário não encontrado"));
        Withdrawal withdrawal = withdrawalRepository.findByIdAndUserId(id, user.getId())
                .orElseThrow(() -> new NotFoundException("Saque não encontrado"));
        return mapToResponse(withdrawal);
    }

    private WithdrawalResponse mapToResponse(Withdrawal w) {
        return new WithdrawalResponse(w.getId(), w.getAmountBrl(), w.getFeeApplied(),
                w.getStatus(), w.getTxHash(), w.getCreatedAt());
    }

    private boolean isSecurityAlert(Long userId, java.math.BigDecimal amount) {
        java.math.BigDecimal average = withdrawalRepository.findAverageAmountByUserId(userId);
        if (average == null || average.compareTo(java.math.BigDecimal.ZERO) <= 0) {
            return false;
        }
        java.math.BigDecimal threshold = average
                .multiply(java.math.BigDecimal.valueOf(alertThresholdPercent))
                .divide(java.math.BigDecimal.valueOf(100));
        return amount.compareTo(threshold) > 0;
    }
}
