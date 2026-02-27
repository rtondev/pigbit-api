package com.pigbit.infrastructure.persistence;

import com.pigbit.core.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    Optional<User> findByTaxId(String taxId);
    boolean existsByEmail(String email);
}
