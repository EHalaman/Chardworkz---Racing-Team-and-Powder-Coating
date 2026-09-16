package com.chardworkz.backend.sales;

import com.chardworkz.backend.account.Account;
import com.chardworkz.backend.branch.Branch;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;
import lombok.*;

/**
 * {@code id} is assigned by the caller (client-generated UUID), never by the
 * database - the Angular Register screen generates it at the moment of sale
 * so an offline-queued sale can sync idempotently on reconnect (Q12,
 * resolved 2026-09-15: local queue + sync-on-reconnect). Re-inserting the
 * same id on a retried sync must be a no-op, not a duplicate sale.
 *
 * <p>No {@code voided}/status field: Q8 (resolved 2026-09-15) is
 * void-before-finalize only - a discarded in-progress cart never becomes a
 * {@code Sale} at all. Post-finalization reversal is a later-phase
 * consideration (see backlog.md), not built now.
 */
@Entity
@Table(name = "sale")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Sale {

    @Id
    private UUID id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "branch_id", nullable = false)
    private Branch branch;

    @ManyToOne(optional = false)
    @JoinColumn(name = "employee_id", nullable = false)
    private Account employee;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_method", nullable = false, length = 20)
    private PaymentMethod paymentMethod;

    @Column(name = "payment_reference", length = 100)
    private String paymentReference;

    /** Optional, walk-in-friendly - most counter sales have no formal customer record. */
    @Column(name = "customer_name", length = 150)
    private String customerName;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal subtotal;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal total;

    /** When the sale actually happened at the register (client clock) - may predate {@link #syncedAt}. */
    @Column(name = "sold_at", nullable = false)
    private Instant soldAt;

    /** When this row was actually written server-side. */
    @Column(name = "synced_at", nullable = false)
    private Instant syncedAt;
}
