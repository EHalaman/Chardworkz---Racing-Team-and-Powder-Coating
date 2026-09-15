package com.chardworkz.backend.inventory;

import com.chardworkz.backend.account.Account;
import com.chardworkz.backend.account.AccountRepository;
import com.chardworkz.backend.branch.Branch;
import com.chardworkz.backend.branch.BranchRepository;
import com.chardworkz.backend.catalog.Product;
import com.chardworkz.backend.catalog.ProductRepository;
import com.chardworkz.backend.security.JwtService;
import com.chardworkz.backend.supplier.StockIn;
import com.chardworkz.backend.supplier.StockInLine;
import com.chardworkz.backend.supplier.StockInLineRepository;
import com.chardworkz.backend.supplier.StockInRepository;
import com.chardworkz.backend.supplier.Supplier;
import com.chardworkz.backend.supplier.SupplierRepository;
import io.jsonwebtoken.Claims;
import jakarta.validation.Valid;
import java.time.Instant;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

/**
 * Stock levels and receiving - Owner/Manager only, per PROJECT-CONTEXT.md's
 * Users section ("Manager - product CRUD, stock receiving, reports"). Unlike
 * {@code ProductController}, nothing here is opened to Employee: the counter
 * flow only ever reads stock via {@code GET /api/products}.
 */
@RestController
@RequestMapping("/api/inventory")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('OWNER', 'MANAGER')")
public class InventoryController {

    private final ProductRepository productRepository;
    private final StockLevelRepository stockLevelRepository;
    private final BranchRepository branchRepository;
    private final SupplierRepository supplierRepository;
    private final StockInRepository stockInRepository;
    private final StockInLineRepository stockInLineRepository;
    private final AccountRepository accountRepository;
    private final JwtService jwtService;

    @GetMapping
    public List<InventorySummaryResponse> list(Authentication authentication) {
        Branch branch = callerBranch(authentication);
        return productRepository.findByActiveTrue().stream()
            .map(product -> toSummary(product, findStockLevel(product, branch)))
            .toList();
    }

    @PatchMapping("/{productId}/reorder-threshold")
    public InventorySummaryResponse updateReorderThreshold(
        @PathVariable Long productId,
        @Valid @RequestBody UpdateReorderThresholdRequest request,
        Authentication authentication) {
        Product product = productRepository.findById(productId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found"));
        Branch branch = callerBranch(authentication);

        StockLevel stockLevel = stockLevelRepository.findByProductIdAndBranchId(productId, branch.getId())
            .orElseGet(() -> newStockLevel(product, branch));
        stockLevel.setReorderThreshold(request.reorderThreshold());
        stockLevel.setUpdatedAt(Instant.now());
        stockLevel = stockLevelRepository.save(stockLevel);

        return toSummary(product, stockLevel);
    }

    @PostMapping("/receive")
    public InventorySummaryResponse receive(
        @Valid @RequestBody ReceiveStockRequest request, Authentication authentication) {
        Product product = productRepository.findById(request.productId())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found"));
        Branch branch = callerBranch(authentication);
        Account receivedBy = accountRepository.getReferenceById(callerAccountId(authentication));

        Supplier supplier = supplierRepository.findByNameIgnoreCase(request.supplierName())
            .orElseGet(() -> supplierRepository.save(Supplier.builder()
                .name(request.supplierName())
                .createdAt(Instant.now())
                .build()));

        Instant now = Instant.now();
        StockIn stockIn = stockInRepository.save(StockIn.builder()
            .supplier(supplier)
            .branch(branch)
            .receivedBy(receivedBy)
            .referenceNo(request.referenceNo())
            .receivedAt(now)
            .build());

        stockInLineRepository.save(StockInLine.builder()
            .stockIn(stockIn)
            .product(product)
            .quantity(request.quantity())
            .unitCost(request.unitCost())
            .build());

        StockLevel stockLevel = stockLevelRepository.findByProductIdAndBranchId(product.getId(), branch.getId())
            .orElseGet(() -> newStockLevel(product, branch));
        stockLevel.setQuantity(stockLevel.getQuantity() + request.quantity());
        stockLevel.setUpdatedAt(now);
        stockLevel = stockLevelRepository.save(stockLevel);

        return toSummary(product, stockLevel);
    }

    @GetMapping("/receipts")
    public List<StockReceiptResponse> receipts(Authentication authentication) {
        Branch branch = callerBranch(authentication);
        return stockInLineRepository.findRecentByBranchId(branch.getId()).stream()
            .map(StockReceiptResponse::from)
            .limit(20)
            .toList();
    }

    private StockLevel findStockLevel(Product product, Branch branch) {
        return stockLevelRepository.findByProductIdAndBranchId(product.getId(), branch.getId()).orElse(null);
    }

    private StockLevel newStockLevel(Product product, Branch branch) {
        return StockLevel.builder()
            .product(product)
            .branch(branch)
            .quantity(0)
            .reorderThreshold(0)
            .updatedAt(Instant.now())
            .build();
    }

    private InventorySummaryResponse toSummary(Product product, StockLevel stockLevel) {
        int quantity = stockLevel != null ? stockLevel.getQuantity() : 0;
        int reorderThreshold = stockLevel != null ? stockLevel.getReorderThreshold() : 0;
        return new InventorySummaryResponse(
            product.getId(), product.getName(), product.getBrandTag(), quantity, reorderThreshold,
            quantity <= reorderThreshold);
    }

    private Branch callerBranch(Authentication authentication) {
        String branchCode = jwtService.extractBranchCode(claims(authentication));
        return branchRepository.findByCode(branchCode)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unknown branch"));
    }

    private Long callerAccountId(Authentication authentication) {
        return jwtService.extractAccountId(claims(authentication));
    }

    private Claims claims(Authentication authentication) {
        return (Claims) authentication.getDetails();
    }
}
