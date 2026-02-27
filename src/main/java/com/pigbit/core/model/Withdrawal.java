package com.pigbit.core.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.SQLRestriction;
import java.math.BigDecimal;


@Data
@Entity
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "withdrawals")
public class Withdrawal extends AuditableEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "wallet_id", nullable = false)
    private Wallet wallet;

    @Column(name = "amount_brl", nullable = false, precision = 15, scale = 2)
    private BigDecimal amountBrl;

    @Column(name = "fee_applied", precision = 15, scale = 2)
    private BigDecimal feeApplied;

    @Column(nullable = false)
    private String status;

    @Builder.Default
    @Column(name = "security_alert")
    private boolean securityAlert = false;

    @Column(name = "tx_hash")
    private String txHash;
}
