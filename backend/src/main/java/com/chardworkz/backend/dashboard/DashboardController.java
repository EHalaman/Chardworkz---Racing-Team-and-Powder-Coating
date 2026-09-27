package com.chardworkz.backend.dashboard;

import com.chardworkz.backend.branch.Branch;
import com.chardworkz.backend.branch.BranchRepository;
import com.chardworkz.backend.catalog.Category;
import com.chardworkz.backend.catalog.Product;
import com.chardworkz.backend.catalog.ProductCostService;
import com.chardworkz.backend.catalog.ProductRepository;
import com.chardworkz.backend.dashboard.DashboardAnalyticsResponse.ChartPoint;
import com.chardworkz.backend.dashboard.DashboardAnalyticsResponse.MarginStatus;
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
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.YearMonth;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.TextStyle;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
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
    private static final int DEAD_STOCK_WINDOW_DAYS = 60;
    private static final DateTimeFormatter HOUR_LABEL_FORMAT = DateTimeFormatter.ofPattern("h a", Locale.ENGLISH);

    private final ProductRepository productRepository;
    private final StockLevelRepository stockLevelRepository;
    private final BranchRepository branchRepository;
    private final SaleRepository saleRepository;
    private final SaleLineRepository saleLineRepository;
    private final StockInLineRepository stockInLineRepository;
    private final JwtService jwtService;
    private final ProductCostService productCostService;

    @GetMapping("/summary")
    public DashboardSummaryResponse summary(
        @RequestParam(required = false) String branchCode, Authentication authentication) {
        List<Branch> branches = resolveBranches(authentication, branchCode);
        Long branchId = resolveBranchId(branches);
        List<Product> stockedProducts = productRepository.findByActiveTrueAndCategoryNot(Category.SERVICES);
        Map<Long, BigDecimal> latestCosts =
            productCostService.latestKnownCosts(stockedProducts.stream().map(Product::getId).toList());
        Map<String, StockLevel> stockLevelsByKey = batchStockLevelsByKey(branches);

        BigDecimal totalStockValue = BigDecimal.ZERO;
        BigDecimal totalStockValueAtCost = BigDecimal.ZERO;
        int lowStockCount = 0;
        for (Product product : stockedProducts) {
            for (Branch branch : branches) {
                StockLevel stockLevel = findStockLevel(stockLevelsByKey, product, branch);
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

        Map<Long, BigDecimal> partCosts = productCostService.latestKnownCosts(
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

    /**
     * Store Health panel + trend chart for a caller-selected time range -
     * separate from {@link #summary}, which is always the current month and
     * feeds the existing KPI cards. Reuses this class's own aggregation-over-
     * fetched-rows approach (same as {@link #summary}/{@link #alerts}) rather
     * than JPQL DTO projections, consistent with DEC-033 at this app's volume.
     */
    @GetMapping("/analytics")
    public DashboardAnalyticsResponse analytics(
        @RequestParam(defaultValue = "MONTH") DashboardTimeRange timeRange,
        @RequestParam(required = false) String branchCode,
        Authentication authentication) {
        List<Branch> branches = resolveBranches(authentication, branchCode);
        Long branchId = resolveBranchId(branches);
        ZoneId zone = ZoneId.systemDefault();
        Instant now = Instant.now();
        LocalDate today = LocalDate.now(zone);

        OperatingHours operatingHours = resolveOperatingHours(branches);
        Instant from = analyticsRangeStart(timeRange, today, zone, operatingHours);
        List<Sale> sales = salesBetween(branchId, from, now);
        List<SaleLine> lines = sales.isEmpty()
            ? List.of()
            : saleLineRepository.findBySaleIdIn(sales.stream().map(Sale::getId).toList());

        // Fall back to the current cost approximation only for lines sold
        // before migration V10 added a per-line snapshot.
        List<Long> productIdsNeedingFallbackCost = lines.stream()
            .filter(line -> line.getUnitCost() == null && line.getProduct().getCategory() != Category.SERVICES)
            .map(line -> line.getProduct().getId())
            .distinct()
            .toList();
        Map<Long, BigDecimal> fallbackCosts = productCostService.latestKnownCosts(productIdsNeedingFallbackCost);

        BigDecimal grossRevenue = BigDecimal.ZERO;
        BigDecimal cogs = BigDecimal.ZERO;
        BigDecimal partsRevenue = BigDecimal.ZERO;
        BigDecimal laborRevenue = BigDecimal.ZERO;
        long lineCountWithKnownCost = 0;
        long lineCountTotal = 0;
        Map<UUID, BigDecimal> revenueBySaleId = new HashMap<>();
        Map<UUID, BigDecimal> cogsBySaleId = new HashMap<>();

        for (SaleLine line : lines) {
            grossRevenue = grossRevenue.add(line.getLineTotal());
            revenueBySaleId.merge(line.getSale().getId(), line.getLineTotal(), BigDecimal::add);

            if (line.getProduct().getCategory() == Category.SERVICES) {
                laborRevenue = laborRevenue.add(line.getLineTotal());
                continue;
            }
            partsRevenue = partsRevenue.add(line.getLineTotal());
            lineCountTotal++;

            BigDecimal unitCost =
                line.getUnitCost() != null ? line.getUnitCost() : fallbackCosts.get(line.getProduct().getId());
            if (unitCost != null) {
                BigDecimal lineCost = unitCost.multiply(BigDecimal.valueOf(line.getQuantity()));
                cogs = cogs.add(lineCost);
                cogsBySaleId.merge(line.getSale().getId(), lineCost, BigDecimal::add);
                lineCountWithKnownCost++;
            }
        }

        BigDecimal grossProfit = grossRevenue.subtract(cogs);
        Double marginPercent = grossRevenue.compareTo(BigDecimal.ZERO) > 0
            ? grossProfit.divide(grossRevenue, 4, RoundingMode.HALF_UP).doubleValue() * 100
            : null;

        BigDecimal averageOrderValue = sales.isEmpty()
            ? BigDecimal.ZERO
            : grossRevenue.divide(BigDecimal.valueOf(sales.size()), 2, RoundingMode.HALF_UP);

        List<ChartPoint> chartSeries =
            buildChartSeries(timeRange, today, zone, operatingHours, sales, revenueBySaleId, cogsBySaleId);
        DeadStock deadStock = computeDeadStock(branches);

        return new DashboardAnalyticsResponse(
            timeRange, grossRevenue, cogs, grossProfit, marginPercent, marginStatus(marginPercent), sales.size(),
            averageOrderValue, partsRevenue, laborRevenue, lineCountWithKnownCost, lineCountTotal,
            deadStock.value(), deadStock.count(), chartSeries);
    }

    @GetMapping("/alerts")
    public List<DashboardAlertResponse> alerts(
        @RequestParam(required = false) String branchCode, Authentication authentication) {
        List<Branch> branches = resolveBranches(authentication, branchCode);
        List<Product> stockedProducts = productRepository.findByActiveTrueAndCategoryNot(Category.SERVICES);
        Map<String, StockLevel> stockLevelsByKey = batchStockLevelsByKey(branches);

        ZoneId zone = ZoneId.systemDefault();
        Instant runRateFrom = LocalDate.now(zone).minusMonths(RUN_RATE_MONTHS).atStartOfDay(zone).toInstant();
        Map<String, Integer> runRateTotals = monthlyRunRateTotals(branches, runRateFrom, Instant.now());

        List<DashboardAlertResponse> alerts = new ArrayList<>();
        for (Product product : stockedProducts) {
            for (Branch branch : branches) {
                StockLevel stockLevel = findStockLevel(stockLevelsByKey, product, branch);
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

    private record OperatingHours(LocalTime opening, LocalTime closing) {}

    /** Widest hours across the branches in scope (earliest opening, latest closing) - so viewing "Both branches" never clips either branch's real sales. */
    private OperatingHours resolveOperatingHours(List<Branch> branches) {
        LocalTime opening = branches.stream().map(Branch::getOpeningTime).min(LocalTime::compareTo).orElse(LocalTime.of(8, 0));
        LocalTime closing = branches.stream().map(Branch::getClosingTime).max(LocalTime::compareTo).orElse(LocalTime.of(19, 0));
        return new OperatingHours(opening, closing);
    }

    private Instant analyticsRangeStart(
        DashboardTimeRange timeRange, LocalDate today, ZoneId zone, OperatingHours operatingHours) {
        return switch (timeRange) {
            case TODAY -> today.atTime(operatingHours.opening()).atZone(zone).toInstant();
            case WEEK -> today.minusDays(6).atStartOfDay(zone).toInstant();
            case MONTH -> today.withDayOfMonth(1).atStartOfDay(zone).toInstant();
            case YTD -> today.withDayOfYear(1).atStartOfDay(zone).toInstant();
        };
    }

    private MarginStatus marginStatus(Double marginPercent) {
        if (marginPercent == null) {
            return MarginStatus.UNKNOWN;
        } else if (marginPercent > 30) {
            return MarginStatus.HEALTHY;
        } else if (marginPercent >= 15) {
            return MarginStatus.WARNING;
        }
        return MarginStatus.AT_RISK;
    }

    /** Bucket granularity follows the selected range: hourly (TODAY), daily (WEEK/MONTH), or monthly (YTD) - each pre-populated with zero so gaps show up as empty bars, not missing ones. */
    private List<ChartPoint> buildChartSeries(
        DashboardTimeRange timeRange, LocalDate today, ZoneId zone, OperatingHours operatingHours, List<Sale> sales,
        Map<UUID, BigDecimal> revenueBySaleId, Map<UUID, BigDecimal> cogsBySaleId) {
        LinkedHashMap<String, String> bucketLabels = new LinkedHashMap<>();
        switch (timeRange) {
            case TODAY -> {
                int startHour = operatingHours.opening().getHour();
                int endHour = operatingHours.closing().getMinute() == 0
                    ? operatingHours.closing().getHour() - 1
                    : operatingHours.closing().getHour();
                endHour = Math.min(23, Math.max(startHour, endHour));
                for (int hour = startHour; hour <= endHour; hour++) {
                    bucketLabels.put(
                        String.valueOf(hour), LocalTime.of(hour, 0).format(HOUR_LABEL_FORMAT));
                }
            }
            case WEEK -> {
                for (int i = 6; i >= 0; i--) {
                    LocalDate day = today.minusDays(i);
                    bucketLabels.put(
                        day.toString(), day.getDayOfWeek().getDisplayName(TextStyle.SHORT, Locale.ENGLISH));
                }
            }
            case MONTH -> {
                LocalDate monthStart = today.withDayOfMonth(1);
                for (LocalDate day = monthStart; !day.isAfter(today); day = day.plusDays(1)) {
                    bucketLabels.put(day.toString(), String.valueOf(day.getDayOfMonth()));
                }
            }
            case YTD -> {
                YearMonth start = YearMonth.from(today.withDayOfYear(1));
                YearMonth end = YearMonth.from(today);
                for (YearMonth ym = start; !ym.isAfter(end); ym = ym.plusMonths(1)) {
                    bucketLabels.put(ym.toString(), ym.getMonth().getDisplayName(TextStyle.SHORT, Locale.ENGLISH));
                }
            }
        }

        Map<String, BigDecimal> revenueByBucket = new HashMap<>();
        Map<String, BigDecimal> cogsByBucket = new HashMap<>();
        for (Sale sale : sales) {
            String key = bucketKey(timeRange, sale.getSoldAt(), zone);
            revenueByBucket.merge(key, revenueBySaleId.getOrDefault(sale.getId(), BigDecimal.ZERO), BigDecimal::add);
            cogsByBucket.merge(key, cogsBySaleId.getOrDefault(sale.getId(), BigDecimal.ZERO), BigDecimal::add);
        }

        List<ChartPoint> series = new ArrayList<>();
        for (Map.Entry<String, String> entry : bucketLabels.entrySet()) {
            BigDecimal revenue = revenueByBucket.getOrDefault(entry.getKey(), BigDecimal.ZERO);
            BigDecimal bucketCogs = cogsByBucket.getOrDefault(entry.getKey(), BigDecimal.ZERO);
            series.add(new ChartPoint(entry.getValue(), revenue, bucketCogs, revenue.subtract(bucketCogs)));
        }
        return series;
    }

    private String bucketKey(DashboardTimeRange timeRange, Instant soldAt, ZoneId zone) {
        ZonedDateTime zoned = soldAt.atZone(zone);
        return switch (timeRange) {
            case TODAY -> String.valueOf(zoned.getHour());
            case WEEK, MONTH -> zoned.toLocalDate().toString();
            case YTD -> YearMonth.from(zoned.toLocalDate()).toString();
        };
    }

    private record DeadStock(BigDecimal value, int count) {}

    /** Active, non-SERVICES products older than {@link #DEAD_STOCK_WINDOW_DAYS} days with zero sales at a branch in that same window - valued at cost (working capital tied up), per branch since stock is per-branch. */
    private DeadStock computeDeadStock(List<Branch> branches) {
        Instant cutoff = Instant.now().minus(Duration.ofDays(DEAD_STOCK_WINDOW_DAYS));
        List<Product> stockedProducts = productRepository.findByActiveTrueAndCategoryNot(Category.SERVICES);
        Map<Long, BigDecimal> costs =
            productCostService.latestKnownCosts(stockedProducts.stream().map(Product::getId).toList());
        Map<String, StockLevel> stockLevelsByKey = batchStockLevelsByKey(branches);

        BigDecimal totalValue = BigDecimal.ZERO;
        int count = 0;
        for (Branch branch : branches) {
            Set<Long> soldRecently = saleLineRepository.findDistinctProductIdsSoldSince(branch.getId(), cutoff);
            for (Product product : stockedProducts) {
                if (product.getCreatedAt().isAfter(cutoff) || soldRecently.contains(product.getId())) {
                    continue;
                }
                StockLevel stockLevel = findStockLevel(stockLevelsByKey, product, branch);
                int quantity = stockLevel != null ? stockLevel.getQuantity() : 0;
                if (quantity == 0) {
                    continue;
                }
                BigDecimal cost = costs.get(product.getId());
                if (cost != null) {
                    totalValue = totalValue.add(cost.multiply(BigDecimal.valueOf(quantity)));
                }
                count++;
            }
        }
        return new DeadStock(totalValue, count);
    }

    private List<Sale> salesBetween(Long branchId, Instant from, Instant to) {
        return branchId != null
            ? saleRepository.findBySoldAtBetweenAndBranchIdOrderBySoldAtDesc(from, to, branchId)
            : saleRepository.findBySoldAtBetweenOrderBySoldAtDesc(from, to);
    }

    /**
     * Every stock_level row across the given branches, fetched once per
     * request instead of one findByProductIdAndBranchId query per
     * product-times-branch pair inside summary()/alerts()/computeDeadStock()'s
     * loops - a real N+1 that scaled with catalog size, not just this
     * controller's usual documented in-memory-aggregation tradeoff (DEC-033).
     */
    private Map<String, StockLevel> batchStockLevelsByKey(List<Branch> branches) {
        Map<String, StockLevel> byKey = new HashMap<>();
        for (Branch branch : branches) {
            for (StockLevel stockLevel : stockLevelRepository.findByBranchId(branch.getId())) {
                byKey.put(stockLevelKey(stockLevel.getProduct().getId(), branch.getId()), stockLevel);
            }
        }
        return byKey;
    }

    private StockLevel findStockLevel(Map<String, StockLevel> stockLevelsByKey, Product product, Branch branch) {
        return stockLevelsByKey.get(stockLevelKey(product.getId(), branch.getId()));
    }

    private String stockLevelKey(Long productId, Long branchId) {
        return productId + ":" + branchId;
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
