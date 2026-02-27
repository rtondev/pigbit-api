package com.pigbit.core.service;

import com.pigbit.application.dto.WalletRequest;
import com.pigbit.application.dto.WalletResponse;
import com.pigbit.application.exception.NotFoundException;
import com.pigbit.core.model.User;
import com.pigbit.core.model.Wallet;
import com.pigbit.infrastructure.persistence.UserRepository;
import com.pigbit.infrastructure.persistence.WalletRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class WalletService {
    private final WalletRepository walletRepository;
    private final UserRepository userRepository;

    public WalletService(WalletRepository walletRepository, UserRepository userRepository) {
        this.walletRepository = walletRepository;
        this.userRepository = userRepository;
    }

    public WalletResponse add(String userEmail, WalletRequest request) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new NotFoundException("Usuário não encontrado"));

        Wallet wallet = Wallet.builder()
                .user(user)
                .address(request.address())
                .currency(request.currency())
                .isActive(true)
                .build();

        return mapToResponse(walletRepository.save(wallet));
    }

    public List<WalletResponse> list(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new NotFoundException("Usuário não encontrado"));
        return walletRepository.findByUserIdAndIsActiveTrue(user.getId()).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public WalletResponse edit(String userEmail, Long walletId, WalletRequest request) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new NotFoundException("Usuário não encontrado"));
        Wallet wallet = walletRepository.findByIdAndUserId(walletId, user.getId())
                .orElseThrow(() -> new NotFoundException("Carteira não encontrada"));

        wallet.setAddress(request.address());
        wallet.setCurrency(request.currency());
        return mapToResponse(walletRepository.save(wallet));
    }

    public void remove(String userEmail, Long walletId) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new NotFoundException("Usuário não encontrado"));
        Wallet wallet = walletRepository.findByIdAndUserId(walletId, user.getId())
                .orElseThrow(() -> new NotFoundException("Carteira não encontrada"));
        wallet.setActive(false);
        walletRepository.save(wallet);
    }

    private WalletResponse mapToResponse(Wallet wallet) {
        return new WalletResponse(wallet.getId(), wallet.getAddress(), wallet.getCurrency(), wallet.isActive());
    }
}
