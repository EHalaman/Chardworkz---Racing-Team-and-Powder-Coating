package com.chardworkz.backend.sales;

import com.chardworkz.backend.branch.Branch;
import com.chardworkz.backend.branch.BranchRepository;
import com.chardworkz.backend.sales.ShiftSummaryResponse.BranchBreakdown;
import com.chardworkz.backend.security.JwtService;
import com.chardworkz.backend.supplier.StockInLine;
import com.chardworkz.backend.supplier.StockInLineRepository;
import io.jsonwebtoken.Claims;
import jakarta.validation.Valid;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

/**
 * Sync target for the Angular offline sale queue (Q12). Branch and employee
 * are always derived from the caller's JWT, never trusted from the request
 * body - see {@link SaleService#recordSale}.
 */
@RestController
@RequestMapping("/api/sales")
@RequiredArgsConstructor
public class SaleController {

    private final SaleService saleService;
    private final JwtService jwtService;
    private final SaleRepository saleRepository;
    private final SaleLineRepository saleLineRepository;
    private final StockInLineRepository stockInLineRepository;
    private final BranchRepository branchRepository;

    @PostMapping
    public ResponseEntity<SaleAckResponse> create(
        @Valid @RequestBody CreateSaleRequest request, Authentication authentication) {
        Claims claims = (Claims) authentication.getDetails();
        String branchCode = jwtService.extractBranchCode(claims);
        Long employeeId = jwtService.extractAccountId(claims);

        SaleAckResponse response = saleService.recordSale(request, branchCode, employeeId);
        HttpStatus status = response.alreadySynced() ? HttpStatus.OK : HttpStatus.CREATED;
        return ResponseEntity.status(status).body(response);
    }

    /**
     * Today's Shift Summary for the Register screen. Employee sees only
     * their branch's counts (transactions/cash/e-wallet, for drawer
     * balancing); Manager is scoped to their own branch like everywhere
     * else in this app; Owner gets a cross-branch view plus a per-branch
     * breakdown. Revenue/cost/margin are never returned to Employee.
     */
    @GetMapping("/shift-summary")
    public ShiftSummaryResponse shiftSummary(Authentication authentication) {
        Claims claims = (Claims) authentication.getDetails();
        String role = jwtService.extractRole(claims);

        ZoneId zone = ZoneId.systemDefault();
        LocalDate today = LocalDate.now(zone);
        Instant dayStart = today.atStartOfDay(zone).toInstant();
        Instant dayEnd = today.plusDays(1).atStartOfDay(zone).toInstant();

        ShiftSummaryResponse response;
        if ("OWNER".equals(role)) {
            List<Branch> branches = branchRepository.findAll();
            List<BranchBreakdown> byBranch = new ArrayList<>();
            ShiftAggregate total = new ShiftAggregate();
            for (Branch branch : branches) {
                ShiftAggregate agg = aggregate(salesForDay(branch.getId(), dayStart, dayEnd));
                byBranch.add(new BranchBreakdown(
                    branch.getCode(), agg.transactionsCount, agg.revenueTotal, agg.costTotal, agg.marginTotal()));
                total.add(agg);
            }
            response = total.toResponse(byBranch);
        } else {
            Branch branch = ownBranch(claims);
            ShiftAggregate agg = aggregate(salesForDay(branch.getId(), dayStart, dayEnd));
            response = agg.toResponse(List.of());
        }

        if ("EMPLOYEE".equals(role)) {
            return new ShiftSummaryResponse(
                response.transactionsCount(), response.cashTotal(), response.ewalletTotal(),
                null, null, null, null, 0, 0, List.of());
        }
        return response;
    }

    private List<Sale> salesForDay(Long branchId, Instant from, Instant to) {
        return saleRepository.findBySoldAtBetweenAndBranchIdOrderBySoldAtDesc(from, to, branchId);
    }

    private ShiftAggregate aggregate(List<Sale> sales) {
        ShiftAggregate agg = new ShiftAggregate();
        agg.transactionsCount = sales.size();
        for (Sale sale : sales) {
            if (sale.getPaymentMethod() == PaymentMethod.CASH) {
                agg.cashTotal = agg.cashTotal.add(sale.getTotal());
            } else {
                agg.ewalletTotal = agg.ewalletTotal.add(sale.getTotal());
            }
            agg.revenueTotal = agg.revenueTotal.add(sale.getTotal());
        }

        if (sales.isEmpty()) {
            return agg;
        }
        List<SaleLine> lines = saleLineRepository.findBySaleIdIn(sales.stream().map(Sale::getId).toList());
        Map<Long, BigDecimal> latestCostByProductId = latestKnownCosts(
            lines.stream().map(line -> line.getProduct().getId()).distinct().toList());

        agg.lineCountTotal = lines.size();
        for (SaleLine line : lines) {
            BigDecimal unitCost = latestCostByProductId.get(line.getProduct().getId());
            if (unitCost != null) {
                agg.costTotal = agg.costTotal.add(unitCost.multiply(BigDecimal.valueOf(line.getQuantity())));
                agg.lineCountWithKnownCost++;
            }
        }
        return agg;
    }

    /** Most recent receipt cost per product (approximation - no FIFO/weighted-average costing exists). */
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

    private Branch ownBranch(Claims claims) {
        String branchCode = jwtService.extractBranchCode(claims);
        return branchRepository.findByCode(branchCode)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unknown branch"));
    }

    private static final class ShiftAggregate {
        int transactionsCount;
        BigDecimal cashTotal = BigDecimal.ZERO;
        BigDecimal ewalletTotal = BigDecimal.ZERO;
        BigDecimal revenueTotal = BigDecimal.ZERO;
        BigDecimal costTotal = BigDecimal.ZERO;
        long lineCountWithKnownCost;
        long lineCountTotal;

        void add(ShiftAggregate other) {
            transactionsCount += other.transactionsCount;
            cashTotal = cashTotal.add(other.cashTotal);
            ewalletTotal = ewalletTotal.add(other.ewalletTotal);
            revenueTotal = revenueTotal.add(other.revenueTotal);
            costTotal = costTotal.add(other.costTotal);
            lineCountWithKnownCost += other.lineCountWithKnownCost;
            lineCountTotal += other.lineCountTotal;
        }

        BigDecimal marginTotal() {
            return revenueTotal.subtract(costTotal);
        }

        Double marginPercent() {
            return revenueTotal.compareTo(BigDecimal.ZERO) > 0
                ? marginTotal().divide(revenueTotal, 4, RoundingMode.HALF_UP).doubleValue() * 100
                : null;
        }

        ShiftSummaryResponse toResponse(List<BranchBreakdown> byBranch) {
            return new ShiftSummaryResponse(
                transactionsCount, cashTotal, ewalletTotal, revenueTotal, costTotal, marginTotal(),
                marginPercent(), lineCountWithKnownCost, lineCountTotal, byBranch);
        }
    }
}
