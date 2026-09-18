package com.chardworkz.backend.inventory;

import com.chardworkz.backend.account.Account;
import com.chardworkz.backend.account.AccountRepository;
import com.chardworkz.backend.branch.Branch;
import com.chardworkz.backend.branch.BranchRepository;
import com.chardworkz.backend.catalog.Category;
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
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

/**
 * Stock levels and receiving - Owner/Manager only, per PROJECT-CONTEXT.md's
 * Users section ("Manager - product CRUD, stock receiving, reports"). Unlike
 * {@code ProductController}, nothing here is opened to Employee: the counter
 * flow only ever reads stock via {@code GET /api/products}.
 *
 * <p>Owner may target any branch via an optional {@code branchCode} (query
 * param on reads, request-body field on writes) - same "Owner sees across
 * both branches, Manager is always forced to their own" split established
 * for {@code ReportsController} (DEC-033), since PROJECT-CONTEXT.md's Users
 * section only documents cross-branch monitoring for Owner. A Manager's
 * {@code branchCode} is always ignored server-side, never trusted from the
 * request.
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
    private final InventoryExportService inventoryExportService;
    private final InventoryImportService inventoryImportService;

    @GetMapping
    public List<InventorySummaryResponse> list(
        @RequestParam(required = false) String branchCode, Authentication authentication) {
        Branch branch = resolveBranch(authentication, branchCode);
        return productRepository.findByActiveTrueAndCategoryNot(Category.SERVICES).stream()
            .map(product -> toSummary(product, findStockLevel(product, branch)))
            .toList();
    }

    /** Same single-branch scope as {@link #list} - Inventory has no merged "both branches" view. */
    @GetMapping("/export")
    public ResponseEntity<byte[]> export(
        @RequestParam(required = false) String branchCode, Authentication authentication) {
        Branch branch = resolveBranch(authentication, branchCode);
        List<Product> products = productRepository.findByActiveTrueAndCategoryNot(Category.SERVICES);
        Map<Long, StockLevel> stockLevelsByProductId = new HashMap<>();
        for (Product product : products) {
            StockLevel stockLevel = findStockLevel(product, branch);
            if (stockLevel != null) {
                stockLevelsByProductId.put(product.getId(), stockLevel);
            }
        }
        byte[] xlsx = inventoryExportService.toXlsx(products, stockLevelsByProductId, branch);

        return ResponseEntity.ok()
            .header("Content-Disposition", "attachment; filename=\"chardworkz-inventory-" + branch.getCode() + ".xlsx\"")
            .contentType(MediaType.parseMediaType(
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
            .body(xlsx);
    }

    /** Parses the uploaded file and validates every row without writing anything - the frontend shows this as a preview the user must confirm before {@link #importCommit}. */
    @PostMapping("/import/preview")
    public InventoryImportPreviewResponse importPreview(
        @RequestParam("file") MultipartFile file,
        @RequestParam(required = false) String branchCode,
        Authentication authentication) {
        Branch branch = resolveBranch(authentication, branchCode);
        return inventoryImportService.preview(file, branch);
    }

    /** Re-parses and re-validates the same file (deterministic, no client-held state to trust) and applies only the rows that pass. */
    @PostMapping("/import/commit")
    public InventoryImportCommitResponse importCommit(
        @RequestParam("file") MultipartFile file,
        @RequestParam(required = false) String branchCode,
        Authentication authentication) {
        Branch branch = resolveBranch(authentication, branchCode);
        return inventoryImportService.commit(file, branch, authentication);
    }

    @PatchMapping("/{productId}/reorder-threshold")
    public InventorySummaryResponse updateReorderThreshold(
        @PathVariable Long productId,
        @Valid @RequestBody UpdateReorderThresholdRequest request,
        Authentication authentication) {
        Product product = productRepository.findById(productId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found"));
        rejectServiceProduct(product);
        Branch branch = resolveBranch(authentication, request.branchCode());

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
        rejectServiceProduct(product);
        Branch branch = resolveBranch(authentication, request.branchCode());
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

    /**
     * Per-branch at-a-glance counts so Owner can spot which branch needs
     * restocking without switching the main view back and forth - Manager
     * only ever gets their own branch back here too, same no-cross-branch-
     * leak rule as every other endpoint in this controller.
     */
    @GetMapping("/branch-summary")
    public List<BranchInventorySummary> branchSummary(Authentication authentication) {
        Claims claims = claims(authentication);
        String role = jwtService.extractRole(claims);
        List<Branch> branches = "OWNER".equals(role)
            ? branchRepository.findAll()
            : List.of(resolveBranch(authentication, null));

        List<Product> stockedProducts = productRepository.findByActiveTrueAndCategoryNot(Category.SERVICES);
        return branches.stream()
            .map(branch -> summarize(branch, stockedProducts))
            .toList();
    }

    private BranchInventorySummary summarize(Branch branch, List<Product> activeProducts) {
        int inStockCount = 0;
        int lowStockCount = 0;
        for (Product product : activeProducts) {
            InventorySummaryResponse summary = toSummary(product, findStockLevel(product, branch));
            if (summary.quantity() > 0) {
                inStockCount++;
            }
            if (summary.lowStock()) {
                lowStockCount++;
            }
        }
        return new BranchInventorySummary(branch.getCode(), inStockCount, lowStockCount);
    }

    @GetMapping("/receipts")
    public List<StockReceiptResponse> receipts(
        @RequestParam(required = false) String branchCode, Authentication authentication) {
        Branch branch = resolveBranch(authentication, branchCode);
        return stockInLineRepository.findRecentByBranchId(branch.getId()).stream()
            .map(StockReceiptResponse::from)
            .limit(20)
            .toList();
    }

    /** Services carry no stock_level concept - reject any attempt to manage stock for one server-side. */
    private void rejectServiceProduct(Product product) {
        if (product.getCategory() == Category.SERVICES) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Service items are not stock-tracked");
        }
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

    private Branch resolveBranch(Authentication authentication, String requestedBranchCode) {
        Claims claims = claims(authentication);
        String role = jwtService.extractRole(claims);
        String ownBranchCode = jwtService.extractBranchCode(claims);
        String effectiveCode =
            "MANAGER".equals(role) || requestedBranchCode == null ? ownBranchCode : requestedBranchCode;
        return branchRepository.findByCode(effectiveCode)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unknown branch"));
    }

    private Long callerAccountId(Authentication authentication) {
        return jwtService.extractAccountId(claims(authentication));
    }

    private Claims claims(Authentication authentication) {
        return (Claims) authentication.getDetails();
    }
}
