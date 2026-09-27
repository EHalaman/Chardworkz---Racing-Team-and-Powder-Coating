package com.chardworkz.backend.inventory;

public record InventoryImportCommitResponse(int updatedCount, int createdCount, int skippedCount) {}
