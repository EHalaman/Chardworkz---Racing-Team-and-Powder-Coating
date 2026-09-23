package com.chardworkz.backend.catalog;

import java.math.BigDecimal;
import java.time.Instant;

public record ProductSummaryResponse(
    Long id,
    String name,
    String brandTag,
    String oemPartNo,
    BigDecimal unitPrice,
    Category category,
    int stockQuantity,
    boolean active,
    Instant createdAt,
    Instant deletedAt) {}
