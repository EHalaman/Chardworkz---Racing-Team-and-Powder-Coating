package com.chardworkz.backend.catalog;

import com.chardworkz.backend.audit.ActionType;
import com.chardworkz.backend.audit.ActivityLogService;
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
 * <p>{@code GET /api/products} stays open to any authenticated role and to
 * every permission state (Register needs it for Employees and for Managers
 * ringing up a sale - a Manager without catalog access can still sell, per
 * an explicit scope confirmation) - every other endpoint below it, including
 * the {@code /admin}/{@code /archived} catalog-management reads, is
 * Owner-unconditional or Manager-only-with-{@code MANAGER_MANAGE_PRODUCTS}
 * enabled (see {@code permission} package). This single master flag
 * (migration V13) replaced two narrower ones (edit-only, delete-only) that
 * left Add/Deactivate/the catalog-management view itself unrestricted for
 * Manager - a real gap the consolidation closes, not just a rename.
 */
@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
public class ProductController {

    private static final String MANAGER_MANAGE = "MANAGER_MANAGE_PRODUCTS";

    private final ProductRepository productRepository;
    private final StockLevelRepository stockLevelRepository;
    private final BranchRepository branchRepository;
    private final JwtService jwtService;
    private final ActivityLogService activityLogService;

    @GetMapping
    public List<ProductSummaryResponse> list(Authentication authentication) {
        return merge(productRepository.findByActiveTrue(), null, authentication);
    }

    @PreAuthorize("hasRole('OWNER') or (hasRole('MANAGER') and @permissionService.isEnabled('" + MANAGER_MANAGE + "'))")
    @GetMapping("/admin")
    public List<ProductSummaryResponse> adminList(
        @RequestParam(required = false) String branch, Authentication authentication) {
        return merge(productRepository.findAll(), branch, authentication);
    }

    /**
     * Archived view: deactivated or deleted products only. A zero-stock but
     * still-active physical product used to land here too, which meant every
     * brand-new product landed here immediately (nothing has been received
     * for it yet) - it now stays in the main catalog with an "Out of stock"
     * badge instead (see DEC-047's follow-up fix); Archived is reserved for
     * an explicit Deactivate/Delete action.
     */
    @PreAuthorize("hasRole('OWNER') or (hasRole('MANAGER') and @permissionService.isEnabled('" + MANAGER_MANAGE + "'))")
    @GetMapping("/archived")
    public List<ProductSummaryResponse> archivedList(
        @RequestParam(required = false) String branch, Authentication authentication) {
        return merge(productRepository.findAll(), branch, authentication).stream()
            .filter(p -> !p.active())
            .toList();
    }

    @PreAuthorize("hasRole('OWNER') or (hasRole('MANAGER') and @permissionService.isEnabled('" + MANAGER_MANAGE + "'))")
    @PostMapping
    public ResponseEntity<ProductSummaryResponse> create(
        @Valid @RequestBody CreateProductRequest request, Authentication authentication) {
        Instant now = Instant.now();
        Product product = Product.builder()
            .name(request.name())
            .brandTag(request.brandTag())
            .oemPartNo(request.oemPartNo())
            .unitPrice(request.unitPrice())
            .category(request.category())
            .active(true)
            .createdAt(now)
            .updatedAt(now)
            .build();
        product = productRepository.save(product);

        activityLogService.record(authentication, ActionType.CREATE, "PRODUCT", String.valueOf(product.getId()),
            null, "Created product \"" + product.getName() + "\"");

        return ResponseEntity.status(HttpStatus.CREATED).body(toResponse(product, authentication));
    }

    @PreAuthorize("hasRole('OWNER') or (hasRole('MANAGER') and @permissionService.isEnabled('" + MANAGER_MANAGE + "'))")
    @PatchMapping("/{id}")
    public ProductSummaryResponse update(
        @PathVariable Long id, @Valid @RequestBody CreateProductRequest request, Authentication authentication) {
        Product product = findOrThrow(id);
        product.setName(request.name());
        product.setBrandTag(request.brandTag());
        product.setOemPartNo(request.oemPartNo());
        product.setUnitPrice(request.unitPrice());
        product.setCategory(request.category());
        product.setUpdatedAt(Instant.now());
        product = productRepository.save(product);

        activityLogService.record(authentication, ActionType.UPDATE, "PRODUCT", String.valueOf(product.getId()),
            null, "Updated product \"" + product.getName() + "\"");

        return toResponse(product, authentication);
    }

    @PreAuthorize("hasRole('OWNER') or (hasRole('MANAGER') and @permissionService.isEnabled('" + MANAGER_MANAGE + "'))")
    @PatchMapping("/{id}/status")
    public ProductSummaryResponse updateStatus(
        @PathVariable Long id, @Valid @RequestBody UpdateProductStatusRequest request, Authentication authentication) {
        Product product = findOrThrow(id);
        product.setActive(request.active());
        product.setUpdatedAt(Instant.now());
        // Reactivating (from either a plain Deactivate or a real Delete) always clears deletedAt - once active again, it's no longer "deleted."
        if (request.active()) {
            product.setDeletedAt(null);
        }
        product = productRepository.save(product);

        activityLogService.record(authentication, ActionType.UPDATE, "PRODUCT", String.valueOf(product.getId()),
            null, (request.active() ? "Reactivated" : "Deactivated") + " product \"" + product.getName() + "\"");

        return toResponse(product, authentication);
    }

    /**
     * Soft-delete: sets is_active=false, same as Deactivate, but also stamps
     * deleted_at so the Archived page and activity log can tell a real
     * Delete apart from a plain Deactivate. Never a real SQL DELETE - product
     * is referenced by sale_line/stock_level/stock_in_line, and hard-deleting
     * a sold product would either violate the FK or destroy real sales
     * history.
     */
    @PreAuthorize("hasRole('OWNER') or (hasRole('MANAGER') and @permissionService.isEnabled('" + MANAGER_MANAGE + "'))")
    @DeleteMapping("/{id}")
    public ProductSummaryResponse delete(@PathVariable Long id, Authentication authentication) {
        Product product = findOrThrow(id);
        product.setActive(false);
        product.setDeletedAt(Instant.now());
        product.setUpdatedAt(Instant.now());
        product = productRepository.save(product);

        activityLogService.record(authentication, ActionType.DELETE, "PRODUCT", String.valueOf(product.getId()),
            null, "Deleted product \"" + product.getName() + "\"");

        return toResponse(product, authentication);
    }

    private Product findOrThrow(Long id) {
        return productRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found"));
    }

    /**
     * {@code branchView} is the optional {@code ?branch=} query param: {@code ALL} sums stock across every
     * branch, a branch code shows that one branch. Only Owner may look beyond their own branch - for anyone
     * else (and when the param is absent) the caller's own branch is used, same as before, so Register's
     * per-branch availability is unaffected.
     */
    private List<ProductSummaryResponse> merge(
        List<Product> products, String branchView, Authentication authentication) {
        Map<Long, Integer> quantityByProductId = new HashMap<>();
        boolean owner = authentication.getAuthorities().stream()
            .anyMatch(a -> "ROLE_OWNER".equals(a.getAuthority()));
        if (owner && branchView != null && "ALL".equalsIgnoreCase(branchView.trim())) {
            for (Object[] row : stockLevelRepository.sumQuantityByProduct()) {
                quantityByProductId.put((Long) row[0], ((Number) row[1]).intValue());
            }
        } else {
            Branch branch = owner && branchView != null && !branchView.isBlank()
                ? branchRepository.findByCode(branchView.trim().toUpperCase())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unknown branch"))
                : callerBranch(authentication);
            for (StockLevel stockLevel : stockLevelRepository.findByBranchId(branch.getId())) {
                quantityByProductId.put(stockLevel.getProduct().getId(), stockLevel.getQuantity());
            }
        }

        return products.stream()
            .map(product -> new ProductSummaryResponse(
                product.getId(),
                product.getName(),
                product.getBrandTag(),
                product.getOemPartNo(),
                product.getUnitPrice(),
                product.getCategory(),
                quantityByProductId.getOrDefault(product.getId(), 0),
                product.isActive(),
                product.getCreatedAt(),
                product.getDeletedAt()))
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
            product.getId(), product.getName(), product.getBrandTag(), product.getOemPartNo(), product.getUnitPrice(),
            product.getCategory(), quantity, product.isActive(), product.getCreatedAt(), product.getDeletedAt());
    }

    private Branch callerBranch(Authentication authentication) {
        Claims claims = (Claims) authentication.getDetails();
        String branchCode = jwtService.extractBranchCode(claims);
        return branchRepository.findByCode(branchCode)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unknown branch"));
    }
}
