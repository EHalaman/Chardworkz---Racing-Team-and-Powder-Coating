package com.chardworkz.backend.reports;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record SalesReportResponse(
    LocalDate from,
    LocalDate to,
    long totalSales,
    BigDecimal totalRevenue,
    List<PaymentMethodBreakdown> byPaymentMethod,
    List<BranchBreakdown> byBranch,
    List<TopProduct> topProducts,
    List<RecentSale> recentSales) {

    public record PaymentMethodBreakdown(String paymentMethod, long count, BigDecimal revenue) {}

    public record BranchBreakdown(String branchCode, long count, BigDecimal revenue) {}

    public record TopProduct(String productName, long quantitySold, BigDecimal revenue) {}

    public record RecentSale(
        UUID id,
        String transactionNumber,
        Instant soldAt,
        String branchCode,
        Long employeeId,
        String employeeName,
        String customerName,
        String paymentMethod,
        String paymentReference,
        BigDecimal total) {}
}
