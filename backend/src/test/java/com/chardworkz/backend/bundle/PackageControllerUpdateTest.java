package com.chardworkz.backend.bundle;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.chardworkz.backend.audit.ActivityLogService;
import com.chardworkz.backend.catalog.Category;
import com.chardworkz.backend.catalog.Product;
import com.chardworkz.backend.catalog.ProductRepository;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.InOrder;
import org.springframework.security.core.Authentication;
import org.springframework.web.server.ResponseStatusException;

/**
 * Regression coverage for {@code PUT /api/packages/{id}}:
 *
 * <ul>
 *   <li>DEC-087 (code-review findings #1/#2): {@code update()} used to delete
 *   a package's existing components before validating the new component
 *   list, so one bad productId in the request permanently wiped a real
 *   package down to zero components.
 *   <li>DEC-088: {@code update()} deleted then re-inserted components without
 *   flushing in between. Hibernate flushes inserts before deletes within a
 *   transaction regardless of code order, so keeping any component from the
 *   old set (same package_id/product_id) tripped {@code package_item}'s
 *   unique constraint - live-verified via a real edit (kept one existing part,
 *   added another) against local Postgres, which a Mockito-only test can't
 *   reproduce since mocks don't enforce real flush ordering or DB
 *   constraints. The {@code flush()} call between delete and save is what
 *   this suite can actually verify: that it happens, in the right order.
 * </ul>
 *
 * Mockito-based, no Spring context - same convention as this project's other
 * controller tests (see AccountControllerRealtimeEventTest).
 */
class PackageControllerUpdateTest {

    private static final Long PACKAGE_ID = 5L;

    private final ServicePackageRepository servicePackageRepository = mock(ServicePackageRepository.class);
    private final PackageItemRepository packageItemRepository = mock(PackageItemRepository.class);
    private final ProductRepository productRepository = mock(ProductRepository.class);
    private final ActivityLogService activityLogService = mock(ActivityLogService.class);

    private final PackageController controller = new PackageController(
        servicePackageRepository, packageItemRepository, productRepository, activityLogService);

    private final Authentication authentication = mock(Authentication.class);

    @Test
    void updatingWithAnUnknownProductIdNeverDeletesOrReplacesExistingComponents() {
        when(servicePackageRepository.findById(PACKAGE_ID)).thenReturn(Optional.of(existingPackage()));
        when(productRepository.findAllById(List.of(99L))).thenReturn(List.of());

        var request = new CreatePackageRequest(
            "PCC SET PACKAGE (CARB)", "desc", null,
            List.of(new CreatePackageRequest.PackageComponentRequest(99L, 1, true)));

        assertThatThrownBy(() -> controller.update(PACKAGE_ID, request, authentication))
            .isInstanceOf(ResponseStatusException.class);

        verify(packageItemRepository, never()).deleteAll(anyList());
        verify(packageItemRepository, never()).saveAll(anyList());
        verify(servicePackageRepository, never()).save(any());
    }

    @Test
    void updatingWithADuplicateProductIdIsA400AndNeverTouchesExistingComponents() {
        when(servicePackageRepository.findById(PACKAGE_ID)).thenReturn(Optional.of(existingPackage()));
        Product labor = product(10L, "Labor", Category.SERVICES, "500.00");
        when(productRepository.findAllById(List.of(10L, 10L))).thenReturn(List.of(labor));

        var request = new CreatePackageRequest(
            "PCC SET PACKAGE (CARB)", "desc", null,
            List.of(
                new CreatePackageRequest.PackageComponentRequest(10L, 1, true),
                new CreatePackageRequest.PackageComponentRequest(10L, 2, false)));

        assertThatThrownBy(() -> controller.update(PACKAGE_ID, request, authentication))
            .isInstanceOfSatisfying(ResponseStatusException.class,
                e -> assertThat(e.getStatusCode().value()).isEqualTo(400));

        verify(packageItemRepository, never()).deleteAll(anyList());
        verify(packageItemRepository, never()).saveAll(anyList());
    }

    @Test
    void updatingReplacesComponentsAndReturnsTheUpdatedPackage() {
        ServicePackage existing = existingPackage();
        when(servicePackageRepository.findById(PACKAGE_ID)).thenReturn(Optional.of(existing));
        when(servicePackageRepository.save(any(ServicePackage.class)))
            .thenAnswer(invocation -> invocation.getArgument(0));

        // productId 10 is kept from the old set (same as staleItem's product below) - this is
        // the exact overlap that tripped package_item's unique constraint pre-DEC-088, since
        // Hibernate flushes inserts before deletes unless the delete is flushed explicitly.
        Product labor = product(10L, "New Labor", Category.SERVICES, "500.00");
        Product part = product(20L, "New Part", Category.OTHERS, "150.00");
        when(productRepository.findAllById(List.of(10L, 20L))).thenReturn(List.of(labor, part));

        PackageItem staleItem = PackageItem.builder()
            .id(1L).servicePackage(existing)
            .product(product(10L, "Old Labor", Category.SERVICES, "999.00"))
            .required(true).defaultQuantity(1).build();
        when(packageItemRepository.findByServicePackage_IdIn(List.of(PACKAGE_ID))).thenReturn(List.of(staleItem));
        when(packageItemRepository.saveAll(anyList())).thenAnswer(invocation -> invocation.getArgument(0));

        var request = new CreatePackageRequest(
            "Updated Name", "Updated description", new BigDecimal("600.00"),
            List.of(
                new CreatePackageRequest.PackageComponentRequest(10L, 1, true),
                new CreatePackageRequest.PackageComponentRequest(20L, 2, false)));

        PackageResponse response = controller.update(PACKAGE_ID, request, authentication);

        verify(packageItemRepository).deleteAll(List.of(staleItem));

        InOrder order = inOrder(packageItemRepository);
        order.verify(packageItemRepository).deleteAll(List.of(staleItem));
        order.verify(packageItemRepository).flush();
        order.verify(packageItemRepository).saveAll(anyList());

        @SuppressWarnings("unchecked")
        ArgumentCaptor<List<PackageItem>> savedItems = ArgumentCaptor.forClass(List.class);
        verify(packageItemRepository).saveAll(savedItems.capture());
        assertThat(savedItems.getValue()).extracting(item -> item.getProduct().getId())
            .containsExactlyInAnyOrder(10L, 20L);

        assertThat(response.name()).isEqualTo("Updated Name");
        assertThat(response.description()).isEqualTo("Updated description");
        assertThat(response.basePrice()).isEqualByComparingTo("600.00");
        assertThat(response.components()).hasSize(2);
    }

    private ServicePackage existingPackage() {
        return ServicePackage.builder()
            .id(PACKAGE_ID)
            .name("PCC SET PACKAGE (CARB)")
            .description("old description")
            .basePrice(new BigDecimal("500.00"))
            .active(true)
            .createdAt(Instant.now())
            .updatedAt(Instant.now())
            .build();
    }

    private Product product(Long id, String name, Category category, String unitPrice) {
        return Product.builder()
            .id(id).name(name).category(category)
            .unitPrice(new BigDecimal(unitPrice))
            .active(true)
            .createdAt(Instant.now())
            .updatedAt(Instant.now())
            .build();
    }
}
