package com.chardworkz.backend.sales;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import java.math.BigDecimal;

public record CreateSaleLineRequest(
    @NotNull Long productId,
    @Positive int quantity,
    @NotNull @PositiveOrZero BigDecimal unitPrice,
    /** Set only when this line came from a package selection (migration V24) - null for a plain individually-added line. */
    Long packageId) {}
