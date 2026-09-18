package com.chardworkz.backend.inventory;

import java.util.List;

public record InventoryImportPreviewResponse(
    List<InventoryImportRowResult> rows, int validCount, int invalidCount) {}
