package com.chardworkz.backend.dashboard;

import com.chardworkz.backend.branch.Branch;
import com.chardworkz.backend.branch.BranchRepository;
import com.chardworkz.backend.catalog.Category;
import com.chardworkz.backend.catalog.Product;
import com.chardworkz.backend.catalog.ProductRepository;
import com.chardworkz.backend.dashboard.DashboardSummaryResponse.MonthlyStockFlow;
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
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
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
 * Composes existing Products/Inventory/Sales data for the Dashboard screen -
 * deliberately not a new source of business logic. In-memory aggregation
 * over fetched rows, consistent with ReportsController/InventoryController
 * (DEC-033) at this app's current data volume, not JPQL DTO projections.
 *
 * <p>Owner sees combined totals across both branches; Manager is always
 * scoped to their own branch - same split used everywhere else in this app.
 */
@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('OWNER', 'MANAGER')")
public class DashboardController {

    private static final int TOP_PRODUCTS_LIMIT = 5;
    private static final int STOCK_FLOW_MONTHS = 9;
    private static final int ACTIVITY_DEFAULT_LIMIT = 5;

    private final ProductRepository productRepository;
    private final StockLevelRepository stockLevelRepository;
    private final BranchRepository branchRepository;
    private final SaleRepository saleRepository;
    private final SaleLineRepository saleLineRepository;
    private final StockInLineRepository stockInLineRepository;
    private final JwtService jwtService;

    @GetMapping("/summary")
    public DashboardSummaryResponse summary(Authentication authentication) {
        List<Branch> branches = relevantBranches(authentication);
        Long branchId = ownBranchIdIfManager(authentication);
        List<Product> stockedProducts = productRepository.findByActiveTrueAndCategoryNot(Category.SERVICES);

        BigDecimal totalStockValue = BigDecimal.ZERO;
        int lowStockCount = 0;
        for (Product product : stockedProducts) {
            for (Branch branch : branches) {
                StockLevel stockLevel = findStockLevel(product, branch);
                int quantity = stockLevel != null ? stockLevel.getQuantity() : 0;
                int reorderThreshold = stockLevel != null ? stockLevel.getReorderThreshold() : 0;
                totalStockValue = totalStockValue.add(product.getUnitPrice().multiply(BigDecimal.valueOf(quantity)));
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

        BigDecimal monthSalesGoal = branches.stream()
            .map(Branch::getMonthlySalesGoal)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        double salesGoalPercent = monthSalesGoal.compareTo(BigDecimal.ZERO) > 0
            ? monthSalesTotal.divide(monthSalesGoal, 4, RoundingMode.HALF_UP).doubleValue() * 100
            : 0;

        List<SaleLine> monthSaleLines = monthSales.isEmpty()
            ? List.of()
            : saleLineRepository.findBySaleIdIn(monthSales.stream().map(Sale::getId).toList());
        List<TopProduct> topProducts = groupBy(monthSaleLines, line -> line.getProduct().getName()).entrySet().stream()
            .map(entry -> new TopProduct(
                entry.getKey(),
                entry.getValue().stream().mapToLong(SaleLine::getQuantity).sum(),
                entry.getValue().stream().map(SaleLine::getLineTotal).reduce(BigDecimal.ZERO, BigDecimal::add)))
            .sorted(Comparator.comparingLong(TopProduct::quantitySold).reversed())
            .limit(TOP_PRODUCTS_LIMIT)
            .toList();

        List<MonthlyStockFlow> stockFlow = buildStockFlow(branchId, zone, today);

        return new DashboardSummaryResponse(
            productRepository.countByActiveTrue(), totalStockValue, lowStockCount, monthSales.size(),
            monthSalesTotal, monthSalesGoal, salesGoalPercent, topProducts, stockFlow);
    }

    @GetMapping("/alerts")
    public List<DashboardAlertResponse> alerts(Authentication authentication) {
        List<Branch> branches = relevantBranches(authentication);
        List<Product> stockedProducts = productRepository.findByActiveTrueAndCategoryNot(Category.SERVICES);

        int outOfStock = 0;
        int lowNotOut = 0;
        for (Product product : stockedProducts) {
            for (Branch branch : branches) {
                StockLevel stockLevel = findStockLevel(product, branch);
                int quantity = stockLevel != null ? stockLevel.getQuantity() : 0;
                int reorderThreshold = stockLevel != null ? stockLevel.getReorderThreshold() : 0;
                if (quantity == 0) {
                    outOfStock++;
                } else if (quantity <= reorderThreshold) {
                    lowNotOut++;
                }
            }
        }

        List<DashboardAlertResponse> alerts = new ArrayList<>();
        if (outOfStock > 0) {
            alerts.add(new DashboardAlertResponse(
                "OUT_OF_STOCK", "Out of Stock Alert", outOfStock + " item(s) are out of stock"));
        }
        if (lowNotOut > 0) {
            alerts.add(new DashboardAlertResponse(
                "LOW_STOCK", "Low Stock Alert", lowNotOut + " item(s) are running low"));
        }
        return alerts;
    }

    @GetMapping("/activity")
    public List<DashboardActivityResponse> activity(
        @RequestParam(required = false) Integer limit, Authentication authentication) {
        int effectiveLimit = limit != null ? limit : ACTIVITY_DEFAULT_LIMIT;
        Long branchId = ownBranchIdIfManager(authentication);

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

    private List<Sale> salesBetween(Long branchId, Instant from, Instant to) {
        return branchId != null
            ? saleRepository.findBySoldAtBetweenAndBranchIdOrderBySoldAtDesc(from, to, branchId)
            : saleRepository.findBySoldAtBetweenOrderBySoldAtDesc(from, to);
    }

    private StockLevel findStockLevel(Product product, Branch branch) {
        return stockLevelRepository.findByProductIdAndBranchId(product.getId(), branch.getId()).orElse(null);
    }

    private List<Branch> relevantBranches(Authentication authentication) {
        Claims claims = claims(authentication);
        if ("OWNER".equals(jwtService.extractRole(claims))) {
            return branchRepository.findAll();
        }
        return List.of(ownBranch(claims));
    }

    /** Null for Owner (combined view); the caller's own branch id for Manager. */
    private Long ownBranchIdIfManager(Authentication authentication) {
        Claims claims = claims(authentication);
        if ("OWNER".equals(jwtService.extractRole(claims))) {
            return null;
        }
        return ownBranch(claims).getId();
    }

    private Branch ownBranch(Claims claims) {
        String branchCode = jwtService.extractBranchCode(claims);
        return branchRepository.findByCode(branchCode)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unknown branch"));
    }

    private Claims claims(Authentication authentication) {
        return (Claims) authentication.getDetails();
    }

    private <T> Map<String, List<T>> groupBy(List<T> items, java.util.function.Function<T, String> keyFn) {
        Map<String, List<T>> grouped = new LinkedHashMap<>();
        for (T item : items) {
            grouped.computeIfAbsent(keyFn.apply(item), key -> new ArrayList<>()).add(item);
        }
        return grouped;
    }
}
