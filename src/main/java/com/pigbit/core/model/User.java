package com.pigbit.core.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.SQLRestriction;

import java.time.LocalDateTime;


@Data
@Entity
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "users")
@SQLRestriction("deleted_at IS NULL")
public class User extends AuditableEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String email;

    @Column(name = "password_hash", nullable = false)
    private String passwordHash;

    @Column(name = "tax_id", length = 20, nullable = false)
    private String taxId;

    private String phone;

    @Column(name = "trading_name")
    private String tradingName;

    @Builder.Default
    @Column(name = "email_verified")
    private boolean emailVerified = false;

    @Builder.Default
    @Column(name = "two_fa_enabled")
    private boolean twoFaEnabled = false;

    @Column(name = "two_fa_secret")
    private String twoFaSecret;

    @Column(name = "email_verified_at")
    private LocalDateTime emailVerifiedAt;

    @Builder.Default
    @Column(name = "is_locked")
    private boolean isLocked = false;

    @Column(name = "lockout_expiry")
    private LocalDateTime lockoutExpiry;
}
