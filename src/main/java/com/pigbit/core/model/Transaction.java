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
@Table(name = "transactions")
public class Transaction extends AuditableEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "invoice_id", nullable = false, unique = true)
    private Invoice invoice;

    @Column(name = "tx_hash")
    private String txHash;

    @Column(name = "explorer_link")
    private String explorerLink;

    private String status;

    @Column(name = "amount_brl")
    private BigDecimal amountBrl;

    @Column(name = "amount_crypto", precision = 20, scale = 8)
    private BigDecimal amountCrypto;

    @Column(name = "confirmed_at")
    private LocalDateTime confirmedAt;
}
