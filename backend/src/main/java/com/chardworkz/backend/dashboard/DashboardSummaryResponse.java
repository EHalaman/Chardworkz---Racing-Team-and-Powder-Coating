package com.chardworkz.backend.dashboard;

import java.math.BigDecimal;
import java.util.List;

/**
 * Cost/margin fields are approximations from each product's most-recently-
 * recorded receipt cost (no FIFO/weighted-average costing exists, same
 * approach as {@code ShiftSummaryResponse}) - {@code lineCountWithKnownCost}
 * vs {@code lineCountTotal} surfaces how much of the month's revenue that
 * approximation actually covers, rather than hiding the gap. Labor
 * (SERVICES-category) lines have no cost concept at all - no wage/technician
 * cost is tracked anywhere in this schema - so they're always excluded from
 * cost/margin math, not estimated at zero.
 */
public record DashboardSummaryResponse(
    long totalProducts,
    BigDecimal totalStockValue,
    BigDecimal totalStockValueAtCost,
    int lowStockCount,
    long monthSalesCount,
    BigDecimal monthSalesTotal,
    BigDecimal monthSalesGoal,
    double salesGoalPercent,
    BigDecimal averageOrderValue,
    BigDecimal partsRevenue,
    BigDecimal laborRevenue,
    BigDecimal estimatedCostTotal,
    BigDecimal estimatedMarginTotal,
    Double estimatedMarginPercent,
    long lineCountWithKnownCost,
    long lineCountTotal,
    List<PaymentMethodBreakdown> paymentMethodBreakdown,
    List<TopProduct> topMarginParts,
    List<TopProduct> topWorkshopServices,
    List<MonthlyStockFlow> stockFlow) {

    public record TopProduct(String productName, long quantitySold, BigDecimal revenue, BigDecimal estimatedMargin) {}

    public record PaymentMethodBreakdown(String paymentMethod, long count, BigDecimal revenue) {}

    public record MonthlyStockFlow(String month, int stockIn, int stockOut) {}
}
