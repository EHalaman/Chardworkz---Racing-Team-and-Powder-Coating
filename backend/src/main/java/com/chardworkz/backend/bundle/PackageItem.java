package com.chardworkz.backend.bundle;

import com.chardworkz.backend.catalog.Product;
import jakarta.persistence.*;
import lombok.*;

/**
 * One default component of a {@link ServicePackage}. {@code isRequired}
 * means the Register customization drawer can never let the cashier exclude
 * it (a labor/service line); {@code false} means it's excludable when the
 * customer supplies their own part, per DEC-084's dynamic exclusion flow.
 */
@Entity
@Table(name = "package_item")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PackageItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "package_id", nullable = false)
    private ServicePackage servicePackage;

    @ManyToOne(optional = false)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(name = "is_required", nullable = false)
    private boolean required;

    @Column(name = "default_quantity", nullable = false)
    private int defaultQuantity;
}
