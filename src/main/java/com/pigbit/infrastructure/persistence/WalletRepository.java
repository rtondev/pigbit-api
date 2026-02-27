package com.pigbit.infrastructure.persistence;

import com.pigbit.core.model.Wallet;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WalletRepository extends JpaRepository<Wallet, Long> {
    List<Wallet> findByUserIdAndIsActiveTrue(Long userId);
    Optional<Wallet> findByIdAndUserId(Long id, Long userId);
}
