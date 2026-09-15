package com.chardworkz.backend.inventory;

public record InventorySummaryResponse(
    Long productId, String name, String brandTag, int quantity, int reorderThreshold, boolean lowStock) {}
