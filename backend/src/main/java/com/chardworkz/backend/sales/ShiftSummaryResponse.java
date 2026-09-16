package com.chardworkz.backend.sales;

import java.math.BigDecimal;
import java.util.List;

/**
 * Revenue/cost/margin fields are null for Employee - a cashier doesn't need
 * (and per the business owner's decision, shouldn't see) store-level
 * profitability, only their own drawer-reconciliation counts. {@code
 * byBranch} is populated for Owner only (cross-branch view); Manager and
 * Employee are always scoped to their own branch, so it's redundant there.
 */
public record ShiftSummaryResponse(
    int transactionsCount,
    BigDecimal cashTotal,
    BigDecimal ewalletTotal,
    BigDecimal revenueTotal,
    BigDecimal estimatedCostTotal,
    BigDecimal estimatedMarginTotal,
    Double estimatedMarginPercent,
    long lineCountWithKnownCost,
    long lineCountTotal,
    List<BranchBreakdown> byBranch) {

    public record BranchBreakdown(
        String branchCode,
        int transactionsCount,
        BigDecimal revenueTotal,
        BigDecimal estimatedCostTotal,
        BigDecimal estimatedMarginTotal) {}
}
