package com.pigbit.infrastructure.persistence;

import com.pigbit.core.model.Withdrawal;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

@Repository
public interface WithdrawalRepository extends JpaRepository<Withdrawal, Long> {
    List<Withdrawal> findByUserId(Long userId);
    Page<Withdrawal> findByUserId(Long userId, Pageable pageable);
    java.util.Optional<Withdrawal> findByIdAndUserId(Long id, Long userId);

    @Query("select avg(w.amountBrl) from Withdrawal w where w.user.id = :userId")
    BigDecimal findAverageAmountByUserId(Long userId);

    @Query("select coalesce(sum(w.amountBrl), 0) from Withdrawal w where w.user.id = :userId")
    BigDecimal sumTotalByUserId(Long userId);
}
