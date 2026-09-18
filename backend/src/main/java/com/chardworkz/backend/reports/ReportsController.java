package com.chardworkz.backend.reports;

import com.chardworkz.backend.account.Account;
import com.chardworkz.backend.account.AccountRepository;
import com.chardworkz.backend.branch.Branch;
import com.chardworkz.backend.branch.BranchRepository;
import com.chardworkz.backend.reports.SalesReportResponse.BranchBreakdown;
import com.chardworkz.backend.reports.SalesReportResponse.PaymentMethodBreakdown;
import com.chardworkz.backend.reports.SalesReportResponse.RecentSale;
import com.chardworkz.backend.reports.SalesReportResponse.TopProduct;
import com.chardworkz.backend.sales.Sale;
import com.chardworkz.backend.sales.SaleLine;
import com.chardworkz.backend.sales.SaleLineRepository;
import com.chardworkz.backend.sales.SaleReceiptResponse;
import com.chardworkz.backend.sales.SaleRepository;
import com.chardworkz.backend.security.JwtService;
import io.jsonwebtoken.Claims;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
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

    /** Matches a "Customer: <name>" search term, scoping the match to customer name only (DEC-049). */
    private static final Pattern CUSTOMER_PREFIX = Pattern.compile("^\\s*customer\\s*:\\s*(.+)$", Pattern.CASE_INSENSITIVE);

    private final SaleRepository saleRepository;
    private final SaleLineRepository saleLineRepository;
    private final BranchRepository branchRepository;
    private final AccountRepository accountRepository;
    private final JwtService jwtService;
    private final SaleExportService saleExportService;

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

        Map<UUID, String> transactionNumbers = computeTransactionNumbers(sales);
        List<RecentSale> recentSales = sales.stream()
            .limit(RECENT_SALES_LIMIT)
            .map(sale -> toRecentSale(sale, transactionNumbers))
            .toList();

        return new SalesReportResponse(
            resolvedFrom, resolvedTo, sales.size(), totalRevenue, byPaymentMethod, byBranch, topProducts, recentSales);
    }

    /**
     * Full, uncapped export of every sale in the selected date/branch range as
     * a downloadable .xlsx - deliberately a separate query from {@link
     * #salesReport}'s own {@code RECENT_SALES_LIMIT}-capped list, since an
     * export exists specifically to get the complete data out. Same
     * date-range resolution and Manager-own-branch/Owner-any-branch scoping
     * as every other endpoint in this controller.
     */
    @GetMapping("/sales/export")
    public ResponseEntity<byte[]> exportSales(
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

        Map<UUID, String> transactionNumbers = computeTransactionNumbers(sales);
        Map<UUID, List<SaleLine>> linesBySaleId = new HashMap<>();
        if (!sales.isEmpty()) {
            for (SaleLine line : saleLineRepository.findBySaleIdIn(sales.stream().map(Sale::getId).toList())) {
                linesBySaleId.computeIfAbsent(line.getSale().getId(), id -> new ArrayList<>()).add(line);
            }
        }

        byte[] xlsx = saleExportService.toXlsx(sales, transactionNumbers, linesBySaleId);

        return ResponseEntity.ok()
            .header("Content-Disposition", "attachment; filename=\"chardworkz-sales-report.xlsx\"")
            .contentType(MediaType.parseMediaType(
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
            .body(xlsx);
    }

    /**
     * Unified Recent Sales search (DEC-049) - a separate endpoint from
     * {@link #salesReport}, not extra params bolted onto it, since search only
     * ever affects the recent-sales list, never the aggregate cards, and this
     * keeps a search keystroke from re-fetching/re-rendering those. Matches
     * customerName, cashier name, and payment reference at the database via
     * an equality/optional-predicate filter over the same date+branch-bounded
     * query {@link #salesReport} already uses; transaction number match is
     * done in-memory after the fact because it isn't a stored column - it's
     * derived per (branch, day) ordinal, same as {@link #saleReceipt}.
     */
    @GetMapping("/sales/search")
    public List<RecentSale> searchSales(
        @RequestParam(required = false) LocalDate from,
        @RequestParam(required = false) LocalDate to,
        @RequestParam(required = false) String branchCode,
        @RequestParam(required = false) String searchQuery,
        @RequestParam(required = false) Long cashierId,
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

        Map<UUID, String> transactionNumbers = computeTransactionNumbers(sales);
        return sales.stream()
            .filter(sale -> cashierId == null || sale.getEmployee().getId().equals(cashierId))
            .filter(sale -> matchesSearch(sale, transactionNumbers.get(sale.getId()), searchQuery))
            .limit(RECENT_SALES_LIMIT)
            .map(sale -> toRecentSale(sale, transactionNumbers))
            .toList();
    }

    /**
     * Staff list for the Recent Sales cashier filter - not the Owner-only
     * {@code /api/accounts} (Manager can't reach that), and includes inactive
     * accounts since this is about filtering historical sales, not who can
     * currently log in.
     */
    @GetMapping("/cashiers")
    public List<CashierSummary> cashiers(Authentication authentication) {
        Claims claims = (Claims) authentication.getDetails();
        String role = jwtService.extractRole(claims);
        List<Account> accounts = "MANAGER".equals(role)
            ? accountRepository.findByBranchIdOrderByFullName(
                resolveBranch(jwtService.extractBranchCode(claims)).getId())
            : accountRepository.findAllByOrderByFullName();
        return accounts.stream().map(a -> new CashierSummary(a.getId(), a.getFullName())).toList();
    }

    public record CashierSummary(Long id, String fullName) {}

    /**
     * Itemized receipt for one sale from this page's own recent-sales list -
     * backs the clickable-card receipt modal for Manager/Owner. Reuses
     * {@link SaleReceiptResponse}, the same shape Register's own receipt
     * modal and "Recent Transactions" reprint already use (DEC-044), rather
     * than inventing a second receipt DTO. Unlike {@code SaleController.today()}
     * this isn't limited to today or the caller's own branch - Manager is
     * still restricted to their own branch (matching every other endpoint in
     * this controller), Owner may open any sale.
     */
    @GetMapping("/sales/{saleId}")
    public SaleReceiptResponse saleReceipt(@PathVariable UUID saleId, Authentication authentication) {
        Sale sale = saleRepository.findById(saleId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Sale not found"));

        Claims claims = (Claims) authentication.getDetails();
        String role = jwtService.extractRole(claims);
        if ("MANAGER".equals(role)
            && !sale.getBranch().getCode().equals(jwtService.extractBranchCode(claims))) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not your branch");
        }

        // Same "ordinal position among that branch's sales that calendar day"
        // derivation as SaleController.today() (DEC-044) - generalized to the
        // sale's own day rather than "today", since a report can reach back
        // up to the selected date range, not just the current day.
        ZoneId zone = ZoneId.systemDefault();
        LocalDate saleDay = sale.getSoldAt().atZone(zone).toLocalDate();
        Instant dayStart = saleDay.atStartOfDay(zone).toInstant();
        Instant dayEnd = saleDay.plusDays(1).atStartOfDay(zone).toInstant();
        List<Sale> sameDaySales = saleRepository.findBySoldAtBetweenAndBranchIdOrderBySoldAtDesc(
            dayStart, dayEnd, sale.getBranch().getId());
        String transactionNumber = computeTransactionNumbers(sameDaySales).get(sale.getId());

        List<SaleLine> lines = saleLineRepository.findBySaleIdIn(List.of(sale.getId()));
        return new SaleReceiptResponse(
            sale.getId(),
            transactionNumber,
            sale.getCustomerName(),
            sale.getCustomerPhone(),
            sale.getCustomerEmail(),
            sale.getBranch().getName(),
            sale.getEmployee().getFullName(),
            sale.getSoldAt(),
            sale.getPaymentMethod().name(),
            sale.getPaymentReference(),
            sale.getSubtotal(),
            sale.getTotal(),
            lines.stream()
                .map(line -> new SaleReceiptResponse.ReceiptLine(
                    line.getProduct().getName(),
                    line.getProduct().getCategory(),
                    line.getQuantity(),
                    line.getUnitPrice(),
                    line.getLineTotal()))
                .toList());
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

    /**
     * Derives each sale's "TXN-YYYYMMDD-####" number from its ordinal position
     * among its own branch's sales that calendar day (DEC-044). {@code sales}
     * must already contain every sale for each (branch, day) pair it covers -
     * both callers pass a date-range query that spans whole days, so this
     * holds without needing a narrower per-day re-fetch.
     */
    private Map<UUID, String> computeTransactionNumbers(List<Sale> sales) {
        ZoneId zone = ZoneId.systemDefault();
        Map<Long, Map<LocalDate, List<Sale>>> byBranchAndDay = new LinkedHashMap<>();
        for (Sale sale : sales) {
            LocalDate day = sale.getSoldAt().atZone(zone).toLocalDate();
            byBranchAndDay
                .computeIfAbsent(sale.getBranch().getId(), b -> new LinkedHashMap<>())
                .computeIfAbsent(day, d -> new ArrayList<>())
                .add(sale);
        }

        Map<UUID, String> numbers = new HashMap<>();
        for (Map<LocalDate, List<Sale>> byDay : byBranchAndDay.values()) {
            for (Map.Entry<LocalDate, List<Sale>> entry : byDay.entrySet()) {
                String datePart = entry.getKey().toString().replace("-", "");
                List<Sale> oldestFirst = new ArrayList<>(entry.getValue());
                oldestFirst.sort(Comparator.comparing(Sale::getSoldAt));
                for (int i = 0; i < oldestFirst.size(); i++) {
                    numbers.put(oldestFirst.get(i).getId(), String.format("TXN-%s-%04d", datePart, i + 1));
                }
            }
        }
        return numbers;
    }

    private RecentSale toRecentSale(Sale sale, Map<UUID, String> transactionNumbers) {
        return new RecentSale(
            sale.getId(),
            transactionNumbers.get(sale.getId()),
            sale.getSoldAt(),
            sale.getBranch().getCode(),
            sale.getEmployee().getId(),
            sale.getEmployee().getFullName(),
            sale.getCustomerName(),
            sale.getPaymentMethod().name(),
            sale.getPaymentReference(),
            sale.getTotal());
    }

    /**
     * "Customer: <name>" scopes the match to customer name only; anything
     * else matches broadly across customer name, cashier name, payment
     * reference, and the derived transaction number - the same fields the
     * frontend's own in-memory search already covered, now backed by the full
     * date range instead of just the top 20 recent sales.
     */
    private boolean matchesSearch(Sale sale, String transactionNumber, String searchQuery) {
        if (searchQuery == null || searchQuery.isBlank()) {
            return true;
        }
        Matcher customerMatch = CUSTOMER_PREFIX.matcher(searchQuery);
        if (customerMatch.matches()) {
            String term = customerMatch.group(1).trim().toLowerCase();
            return sale.getCustomerName() != null && sale.getCustomerName().toLowerCase().contains(term);
        }
        String term = searchQuery.trim().toLowerCase();
        return (sale.getCustomerName() != null && sale.getCustomerName().toLowerCase().contains(term))
            || sale.getEmployee().getFullName().toLowerCase().contains(term)
            || (sale.getPaymentReference() != null && sale.getPaymentReference().toLowerCase().contains(term))
            || transactionNumber.toLowerCase().contains(term);
    }
}
