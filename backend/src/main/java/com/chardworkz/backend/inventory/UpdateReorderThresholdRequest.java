package com.chardworkz.backend.inventory;

import jakarta.validation.constraints.Min;

/** {@code branchCode} is honored for Owner only - Manager is always forced to their own branch. */
public record UpdateReorderThresholdRequest(@Min(0) int reorderThreshold, String branchCode) {}
