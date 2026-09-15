package com.chardworkz.backend.inventory;

import jakarta.validation.constraints.Min;

public record UpdateReorderThresholdRequest(@Min(0) int reorderThreshold) {}
