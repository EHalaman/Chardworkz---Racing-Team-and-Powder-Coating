package com.chardworkz.backend.dashboard;

import java.time.Instant;

/**
 * Unified feed merging {@code sale} and {@code stock_in_line} rows by
 * timestamp - there is no separate activity-log table, so this is composed
 * from the same two sources Register/Inventory already write to.
 */
public record DashboardActivityResponse(String type, String title, String subtitle, Instant occurredAt) {}
