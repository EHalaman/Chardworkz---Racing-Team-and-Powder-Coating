package com.chardworkz.backend.dashboard;

import com.chardworkz.backend.branch.Branch;
import com.chardworkz.backend.branch.BranchRepository;
import com.chardworkz.backend.catalog.Category;
import com.chardworkz.backend.catalog.Product;
import com.chardworkz.backend.catalog.ProductRepository;
import com.chardworkz.backend.dashboard.DashboardSummaryResponse.MonthlyStockFlow;
import com.chardworkz.backend.dashboard.DashboardSummaryResponse.PaymentMethodBreakdown;
import com.chardworkz.backend.dashboard.DashboardSummaryResponse.TopProduct;
import com.chardworkz.backend.inventory.StockLevel;
import com.chardworkz.backend.inventory.StockLevelRepository;
import com.chardworkz.backend.sales.Sale;
import com.chardworkz.backend.sales.SaleLine;
import com.chardworkz.backend.sales.SaleLineRepository;
import com.chardworkz.backend.sales.SaleRepository;
import com.chardworkz.backend.security.JwtService;
import com.chardworkz.backend.supplier.StockInLine;
import com.chardworkz.backend.supplier.StockInLineRepository;
import io.jsonwebtoken.Claims;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.ZoneId;
import java.time.format.TextStyle;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.function.Function;
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
 * Composes existing Products/Inventory/Sales data for the Dashboard screen -
 * deliberately not a new source of business logic. In-memory aggregation
 * over fetched rows, consistent with ReportsController/InventoryController
 * (DEC-033) at this app's current data volume, not JPQL DTO projections.
 *
 * <p>Owner sees combined totals across both branches by default, or a single
 * branch via {@code branchCode}; Manager is always forced to their own
 * branch regardless of that param - same split used everywhere else in this
 * app (ReportsController, InventoryController).
 */
@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('OWNER', 'MANAGER')")
public class DashboardController {

    private static final int TOP_PRODUCTS_LIMIT = 5;
    private static final int STOCK_FLOW_MONTHS = 9;
    private static final int ACTIVITY_DEFAULT_LIMIT = 5;
    private static final int RUN_RATE_MONTHS = 3;
    private static final int ALERT_LIMIT = 10;

    private final ProductRepository productRepository;
    private final StockLevelRepository stockLevelRepository;
    private final BranchRepository branchRepository;
    private final SaleRepository saleRepository;
    private final SaleLineRepository saleLineRepository;
    private final StockInLineRepository stockInLineRepository;
    private final JwtService jwtService;

    @GetMapping("/summary")
    public DashboardSummaryResponse summary(
        @RequestParam(required = false) String branchCode, Authentication authentication) {
        List<Branch> branches = resolveBranches(authentication, branchCode);
        Long branchId = resolveBranchId(branches);
        List<Product> stockedProducts = productRepository.findByActiveTrueAndCategoryNot(Category.SERVICES);
        Map<Long, BigDecimal> latestCosts = latestKnownCosts(stockedProducts.stream().map(Product::getId).toList());

        BigDecimal totalStockValue = BigDecimal.ZERO;
        BigDecimal totalStockValueAtCost = BigDecimal.ZERO;
        int lowStockCount = 0;
        for (Product product : stockedProducts) {
            for (Branch branch : branches) {
                StockLevel stockLevel = findStockLevel(product, branch);
                int quantity = stockLevel != null ? stockLevel.getQuantity() : 0;
                int reorderThreshold = stockLevel != null ? stockLevel.getReorderThreshold() : 0;
                totalStockValue = totalStockValue.add(product.getUnitPrice().multiply(BigDecimal.valueOf(quantity)));
                BigDecimal cost = latestCosts.get(product.getId());
                if (cost != null) {
                    totalStockValueAtCost = totalStockValueAtCost.add(cost.multiply(BigDecimal.valueOf(quantity)));
                }
                if (quantity <= reorderThreshold) {
                    lowStockCount++;
                }
            }
        }

        ZoneId zone = ZoneId.systemDefault();
        LocalDate today = LocalDate.now(zone);
        LocalDate monthStart = today.withDayOfMonth(1);
        Instant monthStartInstant = monthStart.atStartOfDay(zone).toInstant();
        Instant monthEndInstant = monthStart.plusMonths(1).atStartOfDay(zone).toInstant();

        List<Sale> monthSales = salesBetween(branchId, monthStartInstant, monthEndInstant);
        BigDecimal monthSalesTotal = monthSales.stream().map(Sale::getTotal).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal averageOrderValue = monthSales.isEmpty()
            ? BigDecimal.ZERO
            : monthSalesTotal.divide(BigDecimal.valueOf(monthSales.size()), 2, RoundingMode.HALF_UP);

        BigDecimal monthSalesGoal = branches.stream()
            .map(Branch::getMonthlySalesGoal)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        double salesGoalPercent = monthSalesGoal.compareTo(BigDecimal.ZERO) > 0
            ? monthSalesTotal.divide(monthSalesGoal, 4, RoundingMode.HALF_UP).doubleValue() * 100
            : 0;

        List<PaymentMethodBreakdown> paymentMethodBreakdown =
            groupBy(monthSales, sale -> sale.getPaymentMethod().name()).entrySet().stream()
                .map(entry -> new PaymentMethodBreakdown(
                    entry.getKey(), entry.getValue().size(),
                    entry.getValue().stream().map(Sale::getTotal).reduce(BigDecimal.ZERO, BigDecimal::add)))
                .toList();

        List<SaleLine> monthSaleLines = monthSales.isEmpty()
            ? List.of()
            : saleLineRepository.findBySaleIdIn(monthSales.stream().map(Sale::getId).toList());

        BigDecimal partsRevenue = BigDecimal.ZERO;
        BigDecimal laborRevenue = BigDecimal.ZERO;
        List<SaleLine> partLines = new ArrayList<>();
        List<SaleLine> serviceLines = new ArrayList<>();
        for (SaleLine line : monthSaleLines) {
            if (line.getProduct().getCategory() == Category.SERVICES) {
                laborRevenue = laborRevenue.add(line.getLineTotal());
                serviceLines.add(line);
            } else {
                partsRevenue = partsRevenue.add(line.getLineTotal());
                partLines.add(line);
            }
        }

        Map<Long, BigDecimal> partCosts = latestKnownCosts(
            partLines.stream().map(line -> line.getProduct().getId()).distinct().toList());

        BigDecimal estimatedCostTotal = BigDecimal.ZERO;
        long lineCountWithKnownCost = 0;
        for (SaleLine line : partLines) {
            BigDecimal unitCost = partCosts.get(line.getProduct().getId());
            if (unitCost != null) {
                estimatedCostTotal = estimatedCostTotal.add(unitCost.multiply(BigDecimal.valueOf(line.getQuantity())));
                lineCountWithKnownCost++;
            }
        }
        BigDecimal estimatedMarginTotal = partsRevenue.subtract(estimatedCostTotal);
        Double estimatedMarginPercent = partsRevenue.compareTo(BigDecimal.ZERO) > 0
            ? estimatedMarginTotal.divide(partsRevenue, 4, RoundingMode.HALF_UP).doubleValue() * 100
            : null;

        List<TopProduct> topMarginParts = groupBy(partLines, line -> line.getProduct().getName()).entrySet().stream()
            .map(entry -> {
                Long productId = entry.getValue().get(0).getProduct().getId();
                BigDecimal cost = partCosts.get(productId);
                long qty = entry.getValue().stream().mapToLong(SaleLine::getQuantity).sum();
                BigDecimal revenue = entry.getValue().stream()
                    .map(SaleLine::getLineTotal).reduce(BigDecimal.ZERO, BigDecimal::add);
                BigDecimal margin = cost != null ? revenue.subtract(cost.multiply(BigDecimal.valueOf(qty))) : null;
                return new TopProduct(entry.getKey(), qty, revenue, margin);
            })
            .filter(product -> product.estimatedMargin() != null)
            .sorted(Comparator.comparing(TopProduct::estimatedMargin).reversed())
            .limit(TOP_PRODUCTS_LIMIT)
            .toList();

        List<TopProduct> topWorkshopServices =
            groupBy(serviceLines, line -> line.getProduct().getName()).entrySet().stream()
                .map(entry -> new TopProduct(
                    entry.getKey(),
                    entry.getValue().stream().mapToLong(SaleLine::getQuantity).sum(),
                    entry.getValue().stream().map(SaleLine::getLineTotal).reduce(BigDecimal.ZERO, BigDecimal::add),
                    null))
                .sorted(Comparator.comparingLong(TopProduct::quantitySold).reversed())
                .limit(TOP_PRODUCTS_LIMIT)
                .toList();

        List<MonthlyStockFlow> stockFlow = buildStockFlow(branchId, zone, today);

        return new DashboardSummaryResponse(
            productRepository.countByActiveTrue(), totalStockValue, totalStockValueAtCost, lowStockCount,
            monthSales.size(), monthSalesTotal, monthSalesGoal, salesGoalPercent, averageOrderValue,
            partsRevenue, laborRevenue, estimatedCostTotal, estimatedMarginTotal, estimatedMarginPercent,
            lineCountWithKnownCost, (long) partLines.size(), paymentMethodBreakdown,
            topMarginParts, topWorkshopServices, stockFlow);
    }

    @GetMapping("/alerts")
    public List<DashboardAlertResponse> alerts(
        @RequestParam(required = false) String branchCode, Authentication authentication) {
        List<Branch> branches = resolveBranches(authentication, branchCode);
        List<Product> stockedProducts = productRepository.findByActiveTrueAndCategoryNot(Category.SERVICES);

        ZoneId zone = ZoneId.systemDefault();
        Instant runRateFrom = LocalDate.now(zone).minusMonths(RUN_RATE_MONTHS).atStartOfDay(zone).toInstant();
        Map<String, Integer> runRateTotals = monthlyRunRateTotals(branches, runRateFrom, Instant.now());

        List<DashboardAlertResponse> alerts = new ArrayList<>();
        for (Product product : stockedProducts) {
            for (Branch branch : branches) {
                StockLevel stockLevel = findStockLevel(product, branch);
                int quantity = stockLevel != null ? stockLevel.getQuantity() : 0;
                int reorderThreshold = stockLevel != null ? stockLevel.getReorderThreshold() : 0;
                if (quantity > reorderThreshold) {
                    continue;
                }
                int soldInWindow = runRateTotals.getOrDefault(product.getId() + ":" + branch.getId(), 0);
                int avgMonthly = (int) Math.ceil(soldInWindow / (double) RUN_RATE_MONTHS);
                int suggestedReorderQty = Math.max(Math.max(reorderThreshold, avgMonthly), 1);
                alerts.add(new DashboardAlertResponse(
                    quantity == 0 ? "OUT_OF_STOCK" : "LOW_STOCK", product.getId(), product.getName(),
                    branch.getCode(), quantity, reorderThreshold, suggestedReorderQty));
            }
        }

        return alerts.stream()
            .sorted(Comparator
                .comparing((DashboardAlertResponse a) -> "OUT_OF_STOCK".equals(a.type()) ? 0 : 1)
                .thenComparingInt(DashboardAlertResponse::quantity))
            .limit(ALERT_LIMIT)
            .toList();
    }

    @GetMapping("/activity")
    public List<DashboardActivityResponse> activity(
        @RequestParam(required = false) Integer limit,
        @RequestParam(required = false) String branchCode,
        Authentication authentication) {
        int effectiveLimit = limit != null ? limit : ACTIVITY_DEFAULT_LIMIT;
        Long branchId = resolveBranchId(resolveBranches(authentication, branchCode));

        List<Sale> sales = branchId != null
            ? saleRepository.findTop50ByBranchIdOrderBySoldAtDesc(branchId)
            : saleRepository.findTop50ByOrderBySoldAtDesc();
        List<StockInLine> receipts = branchId != null
            ? stockInLineRepository.findTop50ByStockIn_BranchIdOrderByStockIn_ReceivedAtDesc(branchId)
            : stockInLineRepository.findTop50ByOrderByStockIn_ReceivedAtDesc();

        List<DashboardActivityResponse> activity = new ArrayList<>();
        for (Sale sale : sales) {
            activity.add(new DashboardActivityResponse(
                "SALE",
                "Sale completed",
                "₱" + sale.getTotal() + " · " + sale.getPaymentMethod().name() + " · "
                    + sale.getBranch().getCode(),
                sale.getSoldAt()));
        }
        for (StockInLine line : receipts) {
            activity.add(new DashboardActivityResponse(
                "RECEIPT",
                "Stock received",
                line.getQuantity() + " × " + line.getProduct().getName() + " from "
                    + line.getStockIn().getSupplier().getName(),
                line.getStockIn().getReceivedAt()));
        }

        return activity.stream()
            .sorted(Comparator.comparing(DashboardActivityResponse::occurredAt).reversed())
            .limit(effectiveLimit)
            .toList();
    }

    private List<MonthlyStockFlow> buildStockFlow(Long branchId, ZoneId zone, LocalDate today) {
        YearMonth windowStart = YearMonth.from(today).minusMonths(STOCK_FLOW_MONTHS - 1);
        Instant windowStartInstant = windowStart.atDay(1).atStartOfDay(zone).toInstant();
        Instant now = Instant.now();

        List<StockInLine> receipts = branchId != null
            ? stockInLineRepository.findByStockIn_ReceivedAtGreaterThanEqualAndStockIn_BranchId(
                windowStartInstant, branchId)
            : stockInLineRepository.findByStockIn_ReceivedAtGreaterThanEqual(windowStartInstant);

        List<Sale> sales = salesBetween(branchId, windowStartInstant, now);
        List<SaleLine> saleLines = sales.isEmpty()
            ? List.of()
            : saleLineRepository.findBySaleIdIn(sales.stream().map(Sale::getId).toList());

        Map<YearMonth, Integer> stockInByMonth = new LinkedHashMap<>();
        Map<YearMonth, Integer> stockOutByMonth = new LinkedHashMap<>();
        for (int i = STOCK_FLOW_MONTHS - 1; i >= 0; i--) {
            YearMonth month = YearMonth.from(today).minusMonths(i);
            stockInByMonth.put(month, 0);
            stockOutByMonth.put(month, 0);
        }

        for (StockInLine line : receipts) {
            YearMonth month = YearMonth.from(line.getStockIn().getReceivedAt().atZone(zone).toLocalDate());
            stockInByMonth.merge(month, line.getQuantity(), Integer::sum);
        }
        for (SaleLine line : saleLines) {
            YearMonth month = YearMonth.from(line.getSale().getSoldAt().atZone(zone).toLocalDate());
            stockOutByMonth.merge(month, line.getQuantity(), Integer::sum);
        }

        List<MonthlyStockFlow> flow = new ArrayList<>();
        for (Map.Entry<YearMonth, Integer> entry : stockInByMonth.entrySet()) {
            String label = entry.getKey().getMonth().getDisplayName(TextStyle.SHORT, Locale.ENGLISH);
            flow.add(new MonthlyStockFlow(label, entry.getValue(), stockOutByMonth.getOrDefault(entry.getKey(), 0)));
        }
        return flow;
    }

    /** Total units sold per product+branch within [from, to) - used to derive a reorder suggestion from a historical run rate, not a real demand-forecasting model. */
    private Map<String, Integer> monthlyRunRateTotals(List<Branch> branches, Instant from, Instant to) {
        Map<String, Integer> totals = new HashMap<>();
        for (Branch branch : branches) {
            List<Sale> sales = salesBetween(branch.getId(), from, to);
            if (sales.isEmpty()) {
                continue;
            }
            List<SaleLine> lines = saleLineRepository.findBySaleIdIn(sales.stream().map(Sale::getId).toList());
            for (SaleLine line : lines) {
                totals.merge(line.getProduct().getId() + ":" + branch.getId(), line.getQuantity(), Integer::sum);
            }
        }
        return totals;
    }

    /** Most recent receipt cost per product (approximation - no FIFO/weighted-average costing exists, mirrors ShiftSummaryResponse's approach). */
    private Map<Long, BigDecimal> latestKnownCosts(List<Long> productIds) {
        if (productIds.isEmpty()) {
            return Map.of();
        }
        Map<Long, StockInLine> latestByProductId = new HashMap<>();
        for (StockInLine line : stockInLineRepository.findByProduct_IdIn(productIds)) {
            latestByProductId.merge(
                line.getProduct().getId(), line,
                (a, b) -> a.getStockIn().getReceivedAt().isAfter(b.getStockIn().getReceivedAt()) ? a : b);
        }
        Map<Long, BigDecimal> costs = new HashMap<>();
        latestByProductId.forEach((productId, line) -> costs.put(productId, line.getUnitCost()));
        return costs;
    }

    private List<Sale> salesBetween(Long branchId, Instant from, Instant to) {
        return branchId != null
            ? saleRepository.findBySoldAtBetweenAndBranchIdOrderBySoldAtDesc(from, to, branchId)
            : saleRepository.findBySoldAtBetweenOrderBySoldAtDesc(from, to);
    }

    private StockLevel findStockLevel(Product product, Branch branch) {
        return stockLevelRepository.findByProductIdAndBranchId(product.getId(), branch.getId()).orElse(null);
    }

    private List<Branch> resolveBranches(Authentication authentication, String branchCode) {
        Claims claims = claims(authentication);
        if ("OWNER".equals(jwtService.extractRole(claims))) {
            return branchCode != null ? List.of(resolveBranch(branchCode)) : branchRepository.findAll();
        }
        return List.of(resolveBranch(jwtService.extractBranchCode(claims)));
    }

    /** Null when the caller spans multiple branches (Owner, no filter) - callers treat null as "no branch filter" on their own repository queries. */
    private Long resolveBranchId(List<Branch> branches) {
        return branches.size() == 1 ? branches.get(0).getId() : null;
    }

    private Branch resolveBranch(String branchCode) {
        return branchRepository.findByCode(branchCode)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unknown branch"));
    }

    private Claims claims(Authentication authentication) {
        return (Claims) authentication.getDetails();
    }

    private <T> Map<String, List<T>> groupBy(List<T> items, Function<T, String> keyFn) {
        Map<String, List<T>> grouped = new LinkedHashMap<>();
        for (T item : items) {
            grouped.computeIfAbsent(keyFn.apply(item), key -> new ArrayList<>()).add(item);
        }
        return grouped;
    }
}
