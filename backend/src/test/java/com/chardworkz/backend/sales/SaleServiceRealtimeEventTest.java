package com.chardworkz.backend.sales;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import com.chardworkz.backend.account.AccountRepository;
import com.chardworkz.backend.branch.BranchRepository;
import com.chardworkz.backend.bundle.ServicePackageRepository;
import com.chardworkz.backend.catalog.ProductCostService;
import com.chardworkz.backend.catalog.ProductRepository;
import com.chardworkz.backend.inventory.StockLevelRepository;
import com.chardworkz.backend.realtime.SaleCreatedEvent;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.context.ApplicationEventPublisher;

/**
 * Regression coverage for docs/realtime-sales-sync-spec-2026-09-25.md's core
 * correctness requirement: SaleCreatedEvent must publish only on genuine
 * first-time persistence, never on an idempotent replay of an
 * already-synced sale (or a broadcast would fire for a sale every connected
 * client already knows about, on every retried offline-queue sync attempt).
 * Mockito-based, no Spring context or DB - same reasoning as
 * JwtAuthenticationFilterTest / SseEmitterRegistryTest.
 */
class SaleServiceRealtimeEventTest {

    private final SaleRepository saleRepository = mock(SaleRepository.class);
    private final SaleLineRepository saleLineRepository = mock(SaleLineRepository.class);
    private final BranchRepository branchRepository = mock(BranchRepository.class);
    private final AccountRepository accountRepository = mock(AccountRepository.class);
    private final ProductRepository productRepository = mock(ProductRepository.class);
    private final StockLevelRepository stockLevelRepository = mock(StockLevelRepository.class);
    private final ProductCostService productCostService = mock(ProductCostService.class);
    private final ServicePackageRepository servicePackageRepository = mock(ServicePackageRepository.class);
    private final ApplicationEventPublisher eventPublisher = mock(ApplicationEventPublisher.class);

    private final SaleService saleService = new SaleService(
        saleRepository, saleLineRepository, branchRepository, accountRepository,
        productRepository, stockLevelRepository, productCostService, servicePackageRepository, eventPublisher);

    @Test
    void doesNotPublishAnEventOnAnAlreadySyncedReplay() {
        CreateSaleRequest request = new CreateSaleRequest(
            UUID.randomUUID(), PaymentMethod.CASH, null, null, null, null, null,
            Instant.now(), List.of(new CreateSaleLineRequest(1L, 1, BigDecimal.TEN, null)));
        when(saleRepository.existsById(request.id())).thenReturn(true);

        SaleAckResponse response = saleService.recordSale(request, "MAIN", 1L);

        assert response.alreadySynced();
        verifyNoInteractions(eventPublisher);
        // Confirms the replay path really does short-circuit before touching
        // anything else, not just before the event publish specifically.
        verifyNoInteractions(branchRepository, accountRepository, productRepository, stockLevelRepository);
    }

    @Test
    void publishesASaleCreatedEventOnGenuineFirstTimePersistence() {
        CreateSaleRequest request = new CreateSaleRequest(
            UUID.randomUUID(), PaymentMethod.CASH, null, null, null, null, null,
            Instant.now(), List.of());
        when(saleRepository.existsById(request.id())).thenReturn(false);
        when(branchRepository.findByCode("MAIN"))
            .thenReturn(java.util.Optional.of(com.chardworkz.backend.branch.Branch.builder()
                .id(1L).code("MAIN").name("Main Branch").build()));
        when(accountRepository.findById(1L))
            .thenReturn(java.util.Optional.of(com.chardworkz.backend.account.Account.builder().id(1L).build()));

        saleService.recordSale(request, "MAIN", 1L);

        verify(eventPublisher).publishEvent(any(SaleCreatedEvent.class));
    }
}
