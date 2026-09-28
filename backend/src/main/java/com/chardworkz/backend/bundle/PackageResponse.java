package com.chardworkz.backend.bundle;

import com.chardworkz.backend.catalog.Category;
import java.math.BigDecimal;
import java.util.List;

/**
 * {@code defaultTotal} is the sum of every component's {@code unitPrice ×
 * defaultQuantity}. {@code basePrice} (migration V25) is null unless an
 * admin set an explicit discounted bundle price when creating the package -
 * Register's starting total is {@code basePrice} when set, else {@code
 * defaultTotal} (the original DEC-084 behavior); the gap between the two is
 * the bundle's savings. Component stock is deliberately not merged in here
 * (unlike {@code ProductSummaryResponse}) - the drawer looks up live stock
 * from the already-loaded product list by {@code productId} instead of this
 * endpoint carrying a second, branch-scoped copy of the same number.
 */
public record PackageResponse(
    Long id,
    String name,
    String description,
    BigDecimal basePrice,
    BigDecimal defaultTotal,
    boolean active,
    List<PackageComponent> components) {

    public record PackageComponent(
        Long productId,
        String productName,
        Category category,
        BigDecimal unitPrice,
        int defaultQuantity,
        boolean required) {}
}
