package com.chardworkz.backend.reports;

import com.chardworkz.backend.branch.Branch;
import com.chardworkz.backend.branch.BranchRepository;
import com.chardworkz.backend.reports.SalesReportResponse.BranchBreakdown;
import com.chardworkz.backend.reports.SalesReportResponse.PaymentMethodBreakdown;
import com.chardworkz.backend.reports.SalesReportResponse.RecentSale;
import com.chardworkz.backend.reports.SalesReportResponse.TopProduct;
import com.chardworkz.backend.sales.Sale;
import com.chardworkz.backend.sales.SaleLine;
import com.chardworkz.backend.sales.SaleLineRepository;
import com.chardworkz.backend.sales.SaleRepository;
import com.chardworkz.backend.security.JwtService;
import io.jsonwebtoken.Claims;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

/**
 * Read-only sales reporting - Owner/Manager only, per PROJECT-CONTEXT.md's
 * Users section ("Manager - ... reports", "Owner ... monitoring across both
 * branches"). Manager is always scoped to their own branch (the JWT's
 * branch, never a client-supplied one); Owner may optionally filter to one
 * branch, or omit the filter to see both branches aggregated.
 */
@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('OWNER', 'MANAGER')")
public class ReportsController {

    private static final int RECENT_SALES_LIMIT = 20;
    private static final int TOP_PRODUCTS_LIMIT = 5;

    private final SaleRepository saleRepository;
    private final SaleLineRepository saleLineRepository;
    private final BranchRepository branchRepository;
    private final JwtService jwtService;

    @GetMapping("/sales")
    public SalesReportResponse salesReport(
        @RequestParam(required = false) LocalDate from,
        @RequestParam(required = false) LocalDate to,
        @RequestParam(required = false) String branchCode,
        Authentication authentication) {
        Claims claims = (Claims) authentication.getDetails();
        String role = jwtService.extractRole(claims);
        String effectiveBranchCode = "MANAGER".equals(role) ? jwtService.extractBranchCode(claims) : branchCode;

        LocalDate resolvedTo = to != null ? to : LocalDate.now();
        LocalDate resolvedFrom = from != null ? from : resolvedTo.minusDays(29);
        ZoneId zone = ZoneId.systemDefault();
        Instant fromInstant = resolvedFrom.atStartOfDay(zone).toInstant();
        Instant toInstant = resolvedTo.plusDays(1).atStartOfDay(zone).toInstant();

        List<Sale> sales = effectiveBranchCode != null
            ? saleRepository.findBySoldAtBetweenAndBranchIdOrderBySoldAtDesc(
                fromInstant, toInstant, resolveBranch(effectiveBranchCode).getId())
            : saleRepository.findBySoldAtBetweenOrderBySoldAtDesc(fromInstant, toInstant);

        BigDecimal totalRevenue = sales.stream().map(Sale::getTotal).reduce(BigDecimal.ZERO, BigDecimal::add);

        List<PaymentMethodBreakdown> byPaymentMethod = groupBy(sales, sale -> sale.getPaymentMethod().name()).entrySet()
            .stream()
            .map(entry -> new PaymentMethodBreakdown(entry.getKey(), entry.getValue().size(), sumTotals(entry.getValue())))
            .toList();

        List<BranchBreakdown> byBranch = groupBy(sales, sale -> sale.getBranch().getCode()).entrySet().stream()
            .map(entry -> new BranchBreakdown(entry.getKey(), entry.getValue().size(), sumTotals(entry.getValue())))
            .toList();

        List<SaleLine> lines = sales.isEmpty()
            ? List.of()
            : saleLineRepository.findBySaleIdIn(sales.stream().map(Sale::getId).toList());
        List<TopProduct> topProducts = groupBy(lines, line -> line.getProduct().getName()).entrySet().stream()
            .map(entry -> new TopProduct(
                entry.getKey(),
                entry.getValue().stream().mapToLong(SaleLine::getQuantity).sum(),
                entry.getValue().stream().map(SaleLine::getLineTotal).reduce(BigDecimal.ZERO, BigDecimal::add)))
            .sorted(Comparator.comparingLong(TopProduct::quantitySold).reversed())
            .limit(TOP_PRODUCTS_LIMIT)
            .toList();

        List<RecentSale> recentSales = sales.stream()
            .limit(RECENT_SALES_LIMIT)
            .map(sale -> new RecentSale(
                sale.getId(),
                sale.getSoldAt(),
                sale.getBranch().getCode(),
                sale.getEmployee().getFullName(),
                sale.getPaymentMethod().name(),
                sale.getPaymentReference(),
                sale.getTotal()))
            .toList();

        return new SalesReportResponse(
            resolvedFrom, resolvedTo, sales.size(), totalRevenue, byPaymentMethod, byBranch, topProducts, recentSales);
    }

    private BigDecimal sumTotals(List<Sale> sales) {
        return sales.stream().map(Sale::getTotal).reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private <T> Map<String, List<T>> groupBy(List<T> items, java.util.function.Function<T, String> keyFn) {
        Map<String, List<T>> grouped = new LinkedHashMap<>();
        for (T item : items) {
            grouped.computeIfAbsent(keyFn.apply(item), key -> new java.util.ArrayList<>()).add(item);
        }
        return grouped;
    }

    private Branch resolveBranch(String code) {
        return branchRepository.findByCode(code)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unknown branch"));
    }
}
