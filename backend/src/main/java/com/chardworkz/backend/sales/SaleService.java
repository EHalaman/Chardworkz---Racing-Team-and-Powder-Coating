package com.chardworkz.backend.sales;

import com.chardworkz.backend.account.Account;
import com.chardworkz.backend.account.AccountRepository;
import com.chardworkz.backend.branch.Branch;
import com.chardworkz.backend.branch.BranchRepository;
import com.chardworkz.backend.bundle.ServicePackage;
import com.chardworkz.backend.bundle.ServicePackageRepository;
import com.chardworkz.backend.catalog.Category;
import com.chardworkz.backend.catalog.Product;
import com.chardworkz.backend.catalog.ProductCostService;
import com.chardworkz.backend.catalog.ProductRepository;
import com.chardworkz.backend.inventory.StockLevelRepository;
import com.chardworkz.backend.realtime.SaleCreatedEvent;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

/**
 * Records a sale synced from the Angular offline queue (Q12). {@code
 * request.id()} is the client-generated UUID assigned at the moment of sale;
 * the same id resubmitted on a retried sync must be a no-op, not a duplicate
 * sale or a second stock decrement - see {@link #recordSale}.
 */
@Service
@RequiredArgsConstructor
public class SaleService {

    private final SaleRepository saleRepository;
    private final SaleLineRepository saleLineRepository;
    private final BranchRepository branchRepository;
    private final AccountRepository accountRepository;
    private final ProductRepository productRepository;
    private final StockLevelRepository stockLevelRepository;
    private final ProductCostService productCostService;
    private final ServicePackageRepository servicePackageRepository;
    private final ApplicationEventPublisher eventPublisher;

    @Transactional
    public SaleAckResponse recordSale(CreateSaleRequest request, String branchCode, Long employeeId) {
        if (saleRepository.existsById(request.id())) {
            // Idempotent replay of an already-synced sale: skip everything below,
            // most importantly the stock decrement, or a retried sync would
            // double-charge inventory for a sale that already happened.
            return new SaleAckResponse(request.id(), true);
        }

        Branch branch = branchRepository.findByCode(branchCode)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unknown branch"));
        Account employee = accountRepository.findById(employeeId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unknown employee"));

        Sale sale = Sale.builder()
            .id(request.id())
            .branch(branch)
            .employee(employee)
            .paymentMethod(request.paymentMethod())
            .paymentReference(request.paymentReference())
            .customerName(request.customerName())
            .customerPhone(request.customerPhone())
            .customerEmail(request.customerEmail())
            .remarks(request.remarks())
            .soldAt(request.soldAt())
            .syncedAt(Instant.now())
            .subtotal(BigDecimal.ZERO)
            .total(BigDecimal.ZERO)
            .build();

        Map<Long, BigDecimal> costsByProductId = productCostService.latestKnownCosts(
            request.lines().stream().map(CreateSaleLineRequest::productId).distinct().toList());

        List<Long> packageIds = request.lines().stream()
            .map(CreateSaleLineRequest::packageId).filter(java.util.Objects::nonNull).distinct().toList();
        Map<Long, ServicePackage> packagesById = packageIds.isEmpty()
            ? Map.of()
            : servicePackageRepository.findAllById(packageIds).stream()
                .collect(java.util.stream.Collectors.toMap(ServicePackage::getId, sp -> sp));

        BigDecimal subtotal = BigDecimal.ZERO;
        List<SaleLine> lines = new ArrayList<>();
        for (CreateSaleLineRequest lineRequest : request.lines()) {
            Product product = productRepository.findById(lineRequest.productId())
                .orElseThrow(() -> new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Unknown product " + lineRequest.productId()));
            BigDecimal lineTotal = lineRequest.unitPrice().multiply(BigDecimal.valueOf(lineRequest.quantity()));
            subtotal = subtotal.add(lineTotal);

            // Snapshotted at sale time so this line's historical COGS never
            // drifts when a later stock-in receipt changes the price. No cost
            // concept exists for labor (SERVICES), so those lines stay null,
            // same as every other cost/margin computation in this app.
            BigDecimal unitCost = product.getCategory() == Category.SERVICES
                ? null
                : costsByProductId.get(product.getId());

            ServicePackage servicePackage =
                lineRequest.packageId() != null ? packagesById.get(lineRequest.packageId()) : null;
            lines.add(SaleLine.builder()
                .sale(sale)
                .product(product)
                .servicePackage(servicePackage)
                .packageName(servicePackage != null ? servicePackage.getName() : null)
                .quantity(lineRequest.quantity())
                .unitPrice(lineRequest.unitPrice())
                .lineTotal(lineTotal)
                .unitCost(unitCost)
                .build());
        }
        // No discount/tax concept exists yet (reserved for later, like the
        // payment_method/sku columns in DEC-007) - total mirrors subtotal.
        sale.setSubtotal(subtotal);
        sale.setTotal(subtotal);

        try {
            saleRepository.save(sale);
            saleLineRepository.saveAll(lines);
        } catch (DataIntegrityViolationException e) {
            // A genuine race: two sync attempts for the same id landed concurrently
            // and both passed the existsById check above. Treat the loser the same
            // as an idempotent replay rather than surfacing a 500.
            return new SaleAckResponse(request.id(), true);
        }

        for (CreateSaleLineRequest lineRequest : request.lines()) {
            stockLevelRepository.clampDecrement(lineRequest.productId(), branch.getId(), lineRequest.quantity());
        }

        // Genuine first-time persistence only - never on either alreadySynced
        // replay path above. A @TransactionalEventListener(AFTER_COMMIT) picks
        // this up once this transaction actually commits, not before (see
        // docs/realtime-sales-sync-spec-2026-09-25.md).
        eventPublisher.publishEvent(new SaleCreatedEvent(branch.getCode(), sale.getId(), sale.getSoldAt()));

        return new SaleAckResponse(request.id(), false);
    }
}
