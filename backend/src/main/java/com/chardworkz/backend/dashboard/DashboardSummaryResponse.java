package com.chardworkz.backend.dashboard;

import java.math.BigDecimal;
import java.util.List;

public record DashboardSummaryResponse(
    long totalProducts,
    BigDecimal totalStockValue,
    int lowStockCount,
    long monthSalesCount,
    BigDecimal monthSalesTotal,
    BigDecimal monthSalesGoal,
    double salesGoalPercent,
    List<TopProduct> topProducts,
    List<MonthlyStockFlow> stockFlow) {

    public record TopProduct(String productName, long quantitySold, BigDecimal revenue) {}

    public record MonthlyStockFlow(String month, int stockIn, int stockOut) {}
}
