package com.chardworkz.backend.catalog;

import java.math.BigDecimal;

public record ProductSummaryResponse(
    Long id, String name, String brandTag, BigDecimal unitPrice, int stockQuantity, boolean active) {}
