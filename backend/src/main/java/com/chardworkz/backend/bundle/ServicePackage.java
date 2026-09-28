package com.chardworkz.backend.bundle;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;
import lombok.*;

/**
 * A sellable bundle of default components (e.g. "PCC SET PACKAGE (CARB)") a
 * cashier can customize per sale via {@link PackageItem}'s {@code
 * isRequired} flag - see {@code V24__add_service_package_bundling.sql} for
 * why the seeded rows are deliberately dummy/placeholder data.
 */
@Entity
@Table(name = "service_package")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ServicePackage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 150)
    private String name;

    @Column(columnDefinition = "text")
    private String description;

    /** Nullable (migration V25) - when set, an admin-chosen discounted bundle price; when null, the package's price is the sum of its default components (the original DEC-084 behavior). */
    @Column(name = "base_price", precision = 12, scale = 2)
    private BigDecimal basePrice;

    @Column(name = "is_active", nullable = false)
    private boolean active;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
