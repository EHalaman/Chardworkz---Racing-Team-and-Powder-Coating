package com.chardworkz.backend.sales;

import com.chardworkz.backend.catalog.Product;
import jakarta.persistence.*;
import java.math.BigDecimal;
import lombok.*;

@Entity
@Table(name = "sale_line")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SaleLine {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "sale_id", nullable = false)
    private Sale sale;

    @ManyToOne(optional = false)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(nullable = false)
    private int quantity;

    @Column(name = "unit_price", nullable = false, precision = 12, scale = 2)
    private BigDecimal unitPrice;

    @Column(name = "line_total", nullable = false, precision = 12, scale = 2)
    private BigDecimal lineTotal;

    /**
     * Snapshotted from {@link com.chardworkz.backend.catalog.ProductCostService}
     * at the moment of sale (migration V10) - null for sales recorded before
     * this column existed, and always null for SERVICES-category lines (no
     * cost concept exists for labor). Prefer this over a fresh cost lookup
     * when computing historical COGS; fall back to the current approximation
     * only when this is null.
     */
    @Column(name = "unit_cost", precision = 12, scale = 2)
    private BigDecimal unitCost;
}
