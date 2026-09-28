package com.chardworkz.backend.bundle;

import com.chardworkz.backend.audit.ActionType;
import com.chardworkz.backend.audit.ActivityLogService;
import com.chardworkz.backend.catalog.Product;
import com.chardworkz.backend.catalog.ProductRepository;
import jakarta.validation.Valid;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

/**
 * {@code GET /api/packages} stays open to any authenticated role - same
 * scope as {@code GET /api/products}, since Register needs it for Employees
 * and Managers ringing up a sale. Every write and the {@code /admin} read
 * reuse Products' own {@code MANAGER_MANAGE_PRODUCTS} flag (DEC-085) rather
 * than a new permission - package management lives in the same catalog-admin
 * surface as Products, not a separate concern.
 */
@RestController
@RequestMapping("/api/packages")
@RequiredArgsConstructor
public class PackageController {

    private static final String MANAGER_MANAGE = "MANAGER_MANAGE_PRODUCTS";

    private final ServicePackageRepository servicePackageRepository;
    private final PackageItemRepository packageItemRepository;
    private final ProductRepository productRepository;
    private final ActivityLogService activityLogService;

    @GetMapping
    public List<PackageResponse> list() {
        return toResponses(servicePackageRepository.findByActiveTrue());
    }

    @PreAuthorize("hasRole('OWNER') or (hasRole('MANAGER') and @permissionService.isEnabled('" + MANAGER_MANAGE + "'))")
    @GetMapping("/admin")
    public List<PackageResponse> adminList() {
        return toResponses(servicePackageRepository.findAll());
    }

    @PreAuthorize("hasRole('OWNER') or (hasRole('MANAGER') and @permissionService.isEnabled('" + MANAGER_MANAGE + "'))")
    @PostMapping
    public ResponseEntity<PackageResponse> create(
        @Valid @RequestBody CreatePackageRequest request, Authentication authentication) {
        Instant now = Instant.now();
        ServicePackage servicePackage = servicePackageRepository.save(ServicePackage.builder()
            .name(request.name())
            .description(request.description())
            .basePrice(request.basePrice())
            .active(true)
            .createdAt(now)
            .updatedAt(now)
            .build());

        List<Long> productIds = request.components().stream()
            .map(CreatePackageRequest.PackageComponentRequest::productId).toList();
        Map<Long, Product> productsById = productRepository.findAllById(productIds).stream()
            .collect(Collectors.toMap(Product::getId, p -> p));

        List<PackageItem> items = request.components().stream()
            .map(component -> {
                Product product = productsById.get(component.productId());
                if (product == null) {
                    throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST, "Unknown product " + component.productId());
                }
                return PackageItem.builder()
                    .servicePackage(servicePackage)
                    .product(product)
                    .required(component.required())
                    .defaultQuantity(component.quantity())
                    .build();
            })
            .toList();
        packageItemRepository.saveAll(items);

        activityLogService.record(authentication, ActionType.CREATE, "PACKAGE",
            String.valueOf(servicePackage.getId()), null, "Created package \"" + servicePackage.getName() + "\"");

        return ResponseEntity.status(HttpStatus.CREATED).body(toResponse(servicePackage, items));
    }

    /**
     * Replaces a package's definition (name/description/basePrice/components)
     * for FUTURE Register selections only. Never touches an existing {@code
     * sale_line} row - those already carry their own snapshotted {@code
     * unit_price}/{@code unit_cost}/{@code package_name} (migrations V10/V26),
     * so a completed sale's receipt and audit breakdown stay frozen exactly as
     * they were at the moment of sale regardless of what this edits.
     */
    @PreAuthorize("hasRole('OWNER') or (hasRole('MANAGER') and @permissionService.isEnabled('" + MANAGER_MANAGE + "'))")
    @PutMapping("/{id}")
    public PackageResponse update(
        @PathVariable Long id, @Valid @RequestBody CreatePackageRequest request, Authentication authentication) {
        ServicePackage servicePackage = servicePackageRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Package not found"));

        servicePackage.setName(request.name());
        servicePackage.setDescription(request.description());
        servicePackage.setBasePrice(request.basePrice());
        servicePackage.setUpdatedAt(Instant.now());
        servicePackage = servicePackageRepository.save(servicePackage);

        packageItemRepository.deleteAll(packageItemRepository.findByServicePackage_IdIn(List.of(id)));

        List<Long> productIds = request.components().stream()
            .map(CreatePackageRequest.PackageComponentRequest::productId).toList();
        Map<Long, Product> productsById = productRepository.findAllById(productIds).stream()
            .collect(Collectors.toMap(Product::getId, p -> p));

        ServicePackage finalServicePackage = servicePackage;
        List<PackageItem> items = request.components().stream()
            .map(component -> {
                Product product = productsById.get(component.productId());
                if (product == null) {
                    throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST, "Unknown product " + component.productId());
                }
                return PackageItem.builder()
                    .servicePackage(finalServicePackage)
                    .product(product)
                    .required(component.required())
                    .defaultQuantity(component.quantity())
                    .build();
            })
            .toList();
        packageItemRepository.saveAll(items);

        activityLogService.record(authentication, ActionType.UPDATE, "PACKAGE",
            String.valueOf(servicePackage.getId()), null, "Edited package \"" + servicePackage.getName() + "\"");

        return toResponse(servicePackage, items);
    }

    @PreAuthorize("hasRole('OWNER') or (hasRole('MANAGER') and @permissionService.isEnabled('" + MANAGER_MANAGE + "'))")
    @PatchMapping("/{id}/status")
    public PackageResponse updateStatus(
        @PathVariable Long id, @Valid @RequestBody UpdatePackageStatusRequest request, Authentication authentication) {
        ServicePackage servicePackage = servicePackageRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Package not found"));
        servicePackage.setActive(request.active());
        servicePackage.setUpdatedAt(Instant.now());
        servicePackage = servicePackageRepository.save(servicePackage);

        activityLogService.record(authentication, ActionType.UPDATE, "PACKAGE", String.valueOf(servicePackage.getId()),
            null, (request.active() ? "Reactivated" : "Deactivated") + " package \"" + servicePackage.getName() + "\"");

        List<PackageItem> items = packageItemRepository.findByServicePackage_IdIn(List.of(id));
        return toResponse(servicePackage, items);
    }

    private List<PackageResponse> toResponses(List<ServicePackage> packages) {
        if (packages.isEmpty()) {
            return List.of();
        }
        List<PackageItem> items =
            packageItemRepository.findByServicePackage_IdIn(packages.stream().map(ServicePackage::getId).toList());
        var itemsByPackageId = items.stream()
            .collect(Collectors.groupingBy(item -> item.getServicePackage().getId()));
        return packages.stream()
            .map(pkg -> toResponse(pkg, itemsByPackageId.getOrDefault(pkg.getId(), List.of())))
            .toList();
    }

    private PackageResponse toResponse(ServicePackage pkg, List<PackageItem> components) {
        BigDecimal defaultTotal = components.stream()
            .map(item -> item.getProduct().getUnitPrice().multiply(BigDecimal.valueOf(item.getDefaultQuantity())))
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        return new PackageResponse(
            pkg.getId(),
            pkg.getName(),
            pkg.getDescription(),
            pkg.getBasePrice(),
            defaultTotal,
            pkg.isActive(),
            components.stream()
                .map(item -> new PackageResponse.PackageComponent(
                    item.getProduct().getId(),
                    item.getProduct().getName(),
                    item.getProduct().getCategory(),
                    item.getProduct().getUnitPrice(),
                    item.getDefaultQuantity(),
                    item.isRequired()))
                .toList());
    }
}
