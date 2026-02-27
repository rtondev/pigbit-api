package com.pigbit.core.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.SQLRestriction;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Entity
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "invoices")
public class Invoice extends AuditableEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id")
    private Product product;

    @Column(name = "amount_brl", nullable = false)
    private BigDecimal amountBrl;

    @Column(name = "amount_crypto", precision = 20, scale = 8)
    private BigDecimal amountCrypto;

    @Column(name = "crypto_currency")
    private String cryptoCurrency;

    @Column(name = "gateway_fee")
    private BigDecimal gatewayFee;

    @Column(name = "platform_fee")
    private BigDecimal platformFee;

    @Column(name = "exchange_rate")
    private BigDecimal exchangeRate;

    @Column(name = "payment_id", unique = true, nullable = false)
    private String paymentId;

    @Column(name = "pay_address")
    private String payAddress;

    @Column(nullable = false)
    private String status;

    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;
}
