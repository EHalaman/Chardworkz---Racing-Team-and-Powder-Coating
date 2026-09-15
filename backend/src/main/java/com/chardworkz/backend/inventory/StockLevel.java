package com.chardworkz.backend.inventory;

import com.chardworkz.backend.branch.Branch;
import com.chardworkz.backend.catalog.Product;
import jakarta.persistence.*;
import java.time.Instant;
import lombok.*;

/**
 * Deliberately separate from {@link Product}: quantity is per-branch, product
 * identity is not. THESIS1 kept quantity on the product row, which made
 * multi-branch (main + Masinag) unrepresentable.
 */
@Entity
@Table(name = "stock_level", uniqueConstraints = @UniqueConstraint(columnNames = {"product_id", "branch_id"}))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StockLevel {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @ManyToOne(optional = false)
    @JoinColumn(name = "branch_id", nullable = false)
    private Branch branch;

    @Column(nullable = false)
    private int quantity;

    @Column(name = "reorder_threshold", nullable = false)
    private int reorderThreshold;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
