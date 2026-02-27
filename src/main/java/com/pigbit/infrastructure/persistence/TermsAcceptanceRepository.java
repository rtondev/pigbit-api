package com.pigbit.infrastructure.persistence;

import com.pigbit.core.model.TermsAcceptance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TermsAcceptanceRepository extends JpaRepository<TermsAcceptance, Long> {
    List<TermsAcceptance> findByUserIdOrderByAcceptedAtDesc(Long userId);
}
