package com.chardworkz.backend.catalog;

import com.chardworkz.backend.branch.Branch;
import com.chardworkz.backend.branch.BranchRepository;
import com.chardworkz.backend.inventory.StockLevel;
import com.chardworkz.backend.inventory.StockLevelRepository;
import com.chardworkz.backend.security.JwtService;
import io.jsonwebtoken.Claims;
import jakarta.validation.Valid;
import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

/**
 * {@code product} is a global catalog (no {@code branch_id}) - only {@code
 * stock_level} is per-branch, so stock is merged in here per the caller's own
 * branch (from the JWT, never a client-supplied one), defaulting to 0 for a
 * product that has never been stocked at that branch.
 *
 * <p>{@code GET /api/products} stays open to any authenticated role
 * (Register needs it for Employees) - the catalog-management endpoints below
 * it are Owner/Manager only, per PROJECT-CONTEXT.md's Users section.
 */
@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
public class ProductController {

    private final ProductRepository productRepository;
    private final StockLevelRepository stockLevelRepository;
    private final BranchRepository branchRepository;
    private final JwtService jwtService;

    @GetMapping
    public List<ProductSummaryResponse> list(Authentication authentication) {
        return merge(productRepository.findByActiveTrue(), authentication);
    }

    @PreAuthorize("hasAnyRole('OWNER', 'MANAGER')")
    @GetMapping("/admin")
    public List<ProductSummaryResponse> adminList(Authentication authentication) {
        return merge(productRepository.findAll(), authentication);
    }

    @PreAuthorize("hasAnyRole('OWNER', 'MANAGER')")
    @PostMapping
    public ResponseEntity<ProductSummaryResponse> create(
        @Valid @RequestBody CreateProductRequest request, Authentication authentication) {
        Instant now = Instant.now();
        Product product = Product.builder()
            .name(request.name())
            .brandTag(request.brandTag())
            .unitPrice(request.unitPrice())
            .active(true)
            .createdAt(now)
            .updatedAt(now)
            .build();
        product = productRepository.save(product);

        return ResponseEntity.status(HttpStatus.CREATED).body(toResponse(product, authentication));
    }

    @PreAuthorize("hasAnyRole('OWNER', 'MANAGER')")
    @PatchMapping("/{id}")
    public ProductSummaryResponse update(
        @PathVariable Long id, @Valid @RequestBody CreateProductRequest request, Authentication authentication) {
        Product product = productRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found"));
        product.setName(request.name());
        product.setBrandTag(request.brandTag());
        product.setUnitPrice(request.unitPrice());
        product.setUpdatedAt(Instant.now());
        return toResponse(productRepository.save(product), authentication);
    }

    @PreAuthorize("hasAnyRole('OWNER', 'MANAGER')")
    @PatchMapping("/{id}/status")
    public ProductSummaryResponse updateStatus(
        @PathVariable Long id, @Valid @RequestBody UpdateProductStatusRequest request, Authentication authentication) {
        Product product = productRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found"));
        product.setActive(request.active());
        product.setUpdatedAt(Instant.now());
        return toResponse(productRepository.save(product), authentication);
    }

    private List<ProductSummaryResponse> merge(List<Product> products, Authentication authentication) {
        Branch branch = callerBranch(authentication);
        Map<Long, Integer> quantityByProductId = new HashMap<>();
        for (StockLevel stockLevel : stockLevelRepository.findByBranchId(branch.getId())) {
            quantityByProductId.put(stockLevel.getProduct().getId(), stockLevel.getQuantity());
        }

        return products.stream()
            .map(product -> new ProductSummaryResponse(
                product.getId(),
                product.getName(),
                product.getBrandTag(),
                product.getUnitPrice(),
                quantityByProductId.getOrDefault(product.getId(), 0),
                product.isActive()))
            .toList();
    }

    private ProductSummaryResponse toResponse(Product product, Authentication authentication) {
        Branch branch = callerBranch(authentication);
        int quantity = stockLevelRepository.findByBranchId(branch.getId()).stream()
            .filter(stockLevel -> stockLevel.getProduct().getId().equals(product.getId()))
            .findFirst()
            .map(StockLevel::getQuantity)
            .orElse(0);
        return new ProductSummaryResponse(
            product.getId(), product.getName(), product.getBrandTag(), product.getUnitPrice(), quantity,
            product.isActive());
    }

    private Branch callerBranch(Authentication authentication) {
        Claims claims = (Claims) authentication.getDetails();
        String branchCode = jwtService.extractBranchCode(claims);
        return branchRepository.findByCode(branchCode)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unknown branch"));
    }
}
