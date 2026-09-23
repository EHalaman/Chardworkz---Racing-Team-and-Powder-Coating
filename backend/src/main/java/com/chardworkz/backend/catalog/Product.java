package com.chardworkz.backend.catalog;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;
import lombok.*;

@Entity
@Table(name = "product")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Reserved from Phase 0, unused until barcode scanning is built (deferred). */
    @Column(length = 50)
    private String sku;

    /** Reserved from Phase 0, unused until barcode scanning is built (deferred). */
    @Column(length = 50)
    private String barcode;

    @Column(nullable = false, length = 150)
    private String name;

    @Column(columnDefinition = "text")
    private String description;

    /** THESIS1's tag/brand search requirement. */
    @Column(name = "brand_tag", length = 100)
    private String brandTag;

    /** Manufacturer's genuine-parts catalogue number, e.g. Suzuki's "09482-00646-000" - distinct from {@code sku} (an internal barcode scheme, still unused). */
    @Column(name = "oem_part_no", length = 30)
    private String oemPartNo;

    @Column(name = "unit_price", nullable = false, precision = 12, scale = 2)
    private BigDecimal unitPrice;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private Category category;

    @Column(name = "is_active", nullable = false)
    private boolean active;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    /** Set only by a real "Delete" action, distinguishing it from a plain Deactivate (which leaves this null). Cleared on Reactivate. */
    @Column(name = "deleted_at")
    private Instant deletedAt;
}
