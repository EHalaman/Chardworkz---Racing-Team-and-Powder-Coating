package com.chardworkz.backend.supplier;

import com.chardworkz.backend.account.Account;
import com.chardworkz.backend.branch.Branch;
import jakarta.persistence.*;
import java.time.Instant;
import lombok.*;

@Entity
@Table(name = "stock_in")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StockIn {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "supplier_id", nullable = false)
    private Supplier supplier;

    @ManyToOne(optional = false)
    @JoinColumn(name = "branch_id", nullable = false)
    private Branch branch;

    @ManyToOne(optional = false)
    @JoinColumn(name = "received_by", nullable = false)
    private Account receivedBy;

    @Column(name = "reference_no", length = 50)
    private String referenceNo;

    @Column(name = "received_at", nullable = false)
    private Instant receivedAt;
}
