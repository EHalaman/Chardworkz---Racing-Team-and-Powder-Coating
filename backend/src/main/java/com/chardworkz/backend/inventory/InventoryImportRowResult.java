package com.chardworkz.backend.inventory;

/** One row of an Inventory Excel/CSV import preview or commit result. {@code reason} is non-null only when {@code valid} is false. */
public record InventoryImportRowResult(
    int rowNumber,
    Long productId,
    String productName,
    Integer currentQuantity,
    Integer newQuantity,
    Integer currentReorderThreshold,
    Integer newReorderThreshold,
    boolean valid,
    String reason) {}
