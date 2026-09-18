package com.chardworkz.backend.dashboard;

import java.math.BigDecimal;
import java.util.List;

/**
 * {@code GET /api/dashboard/analytics}'s Store Health panel + trend chart, for
 * a caller-selected {@link DashboardTimeRange} (unlike {@code /summary},
 * which is always the current month).
 *
 * <p>{@code cogs}/{@code grossProfit} prefer each sale line's own {@code
 * unit_cost} snapshot (migration V10, accurate as of the moment of sale) and
 * fall back to {@link com.chardworkz.backend.catalog.ProductCostService}'s
 * current-cost approximation only for lines sold before that column existed
 * - {@code lineCountWithKnownCost} vs {@code lineCountTotal} says how much of
 * the range's revenue that combination actually covers. Labor (SERVICES)
 * lines have no cost concept and are excluded from {@code cogs} entirely, so
 * a labor-heavy range shows a higher {@code grossProfitMarginPercent} - that
 * is correct, not a bug, since no wage/technician cost is tracked anywhere in
 * this schema (same convention as {@code DashboardSummaryResponse}).
 */
public record DashboardAnalyticsResponse(
    DashboardTimeRange timeRange,
    BigDecimal grossRevenue,
    BigDecimal cogs,
    BigDecimal grossProfit,
    Double grossProfitMarginPercent,
    MarginStatus marginStatus,
    long completedSalesCount,
    BigDecimal averageOrderValue,
    BigDecimal partsRevenue,
    BigDecimal laborRevenue,
    long lineCountWithKnownCost,
    long lineCountTotal,
    BigDecimal deadStockValue,
    int deadStockCount,
    List<ChartPoint> chartSeries) {

    /** Thresholds are the business's own call, not a universal retail benchmark - see backlog.md if these ever need revisiting per real margin data. */
    public enum MarginStatus {
        HEALTHY,
        WARNING,
        AT_RISK,
        UNKNOWN
    }

    public record ChartPoint(String label, BigDecimal revenue, BigDecimal cogs, BigDecimal grossProfit) {}
}
