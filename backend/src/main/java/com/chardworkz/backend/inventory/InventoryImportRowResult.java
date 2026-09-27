package com.chardworkz.backend.inventory;

/** One row of an Inventory Excel/CSV import preview or commit result. {@code reason} is non-null only when {@code valid} is false. {@code created} is true when the row will create (or created) a brand-new product rather than updating an existing one. */
public record InventoryImportRowResult(
    int rowNumber,
    Long productId,
    String productName,
    Integer currentQuantity,
    Integer newQuantity,
    Integer currentReorderThreshold,
    Integer newReorderThreshold,
    boolean valid,
    boolean created,
    String reason) {}
