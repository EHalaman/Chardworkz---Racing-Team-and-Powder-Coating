package com.chardworkz.backend.dashboard;

/**
 * Only alert types backed by real data - out-of-stock and low-stock, both
 * computable from {@code stock_level}. "Expiring soon" from the original
 * mock UI has no backing field anywhere in the schema (no expiry date on
 * `product`), so it's deliberately not reproduced here rather than faked.
 */
public record DashboardAlertResponse(String type, String title, String message) {}
