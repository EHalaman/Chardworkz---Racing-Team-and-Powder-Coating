package com.chardworkz.backend.supplier;

import com.chardworkz.backend.catalog.Product;
import jakarta.persistence.*;
import java.math.BigDecimal;
import lombok.*;

@Entity
@Table(name = "stock_in_line")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StockInLine {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "stock_in_id", nullable = false)
    private StockIn stockIn;

    @ManyToOne(optional = false)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(nullable = false)
    private int quantity;

    @Column(name = "unit_cost", nullable = false, precision = 12, scale = 2)
    private BigDecimal unitCost;
}
