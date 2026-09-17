package com.chardworkz.backend.dashboard;

/**
 * One row per low/out-of-stock product+branch, not an aggregate count -
 * lets the UI link straight into Inventory's existing restock flow
 * (?restock=&lt;productId&gt;) with a pre-filled quantity, instead of a
 * generic "2 items out of stock" message with nothing to act on.
 * {@code suggestedReorderQty} is the last 3 months' average monthly units
 * sold for this product+branch, rounded up, floored at
 * {@code reorderThreshold} so the suggestion always at least clears the
 * alert - not a real demand-forecasting model, just a historical run rate.
 */
public record DashboardAlertResponse(
    String type,
    Long productId,
    String productName,
    String branchCode,
    int quantity,
    int reorderThreshold,
    int suggestedReorderQty) {}
