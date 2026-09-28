package com.chardworkz.backend.bundle;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.util.List;

/**
 * {@code basePrice} is optional - leave it null to price the package at the
 * live sum of its components (no discount), or set it to whatever discounted
 * bundle price the owner/manager wants to sell it at. {@code @Size} bounds
 * match {@code service_package}'s column widths, same convention as {@code
 * CreateProductRequest}.
 */
public record CreatePackageRequest(
    @NotBlank @Size(max = 150) String name,
    @Size(max = 2000) String description,
    @PositiveOrZero BigDecimal basePrice,
    @NotEmpty List<@Valid PackageComponentRequest> components) {

    public record PackageComponentRequest(
        @NotNull Long productId, @Positive int quantity, boolean required) {}
}
