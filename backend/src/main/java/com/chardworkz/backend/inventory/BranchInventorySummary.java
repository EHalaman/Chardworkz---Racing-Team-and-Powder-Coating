package com.chardworkz.backend.inventory;

public record BranchInventorySummary(String branchCode, int inStockCount, int lowStockCount) {}
