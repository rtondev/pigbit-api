package com.pigbit.infrastructure.persistence;

import com.pigbit.core.model.Company;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CompanyRepository extends JpaRepository<Company, Long> {
    Optional<Company> findByUserId(Long userId);
    Optional<Company> findByUserIdAndDeletedAtIsNull(Long userId);
}
