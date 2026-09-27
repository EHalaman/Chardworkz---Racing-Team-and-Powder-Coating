package com.chardworkz.backend.inventory;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.chardworkz.backend.account.Account;
import com.chardworkz.backend.account.AccountRepository;
import com.chardworkz.backend.audit.ActivityLogService;
import com.chardworkz.backend.branch.Branch;
import com.chardworkz.backend.catalog.Category;
import com.chardworkz.backend.catalog.Product;
import com.chardworkz.backend.catalog.ProductCostService;
import com.chardworkz.backend.catalog.ProductRepository;
import com.chardworkz.backend.security.JwtService;
import com.chardworkz.backend.supplier.StockInLineRepository;
import com.chardworkz.backend.supplier.StockInRepository;
import com.chardworkz.backend.supplier.Supplier;
import com.chardworkz.backend.supplier.SupplierRepository;
import io.jsonwebtoken.Claims;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.core.Authentication;
import org.springframework.web.server.ResponseStatusException;

/**
 * Covers the row-resolution logic added for new-product auto-creation and
 * Unit-Cost-as-receipt-line persistence (see the class-level Javadoc on
 * {@link InventoryImportService}) - Mockito-based, no Spring context or DB,
 * same style as SaleServiceRealtimeEventTest.
 */
class InventoryImportServiceTest {

    private final ProductRepository productRepository = mock(ProductRepository.class);
    private final StockLevelRepository stockLevelRepository = mock(StockLevelRepository.class);
    private final ActivityLogService activityLogService = mock(ActivityLogService.class);
    private final ProductCostService productCostService = mock(ProductCostService.class);
    private final StockInRepository stockInRepository = mock(StockInRepository.class);
    private final StockInLineRepository stockInLineRepository = mock(StockInLineRepository.class);
    private final SupplierRepository supplierRepository = mock(SupplierRepository.class);
    private final AccountRepository accountRepository = mock(AccountRepository.class);
    private final JwtService jwtService = mock(JwtService.class);

    private final InventoryImportService service = new InventoryImportService(
        productRepository, stockLevelRepository, activityLogService, productCostService, stockInRepository,
        stockInLineRepository, supplierRepository, accountRepository, jwtService);

    private final Branch branch = Branch.builder().id(1L).code("MAIN").name("Main Branch").build();

    private static final String HEADER =
        "Product ID,Product Name,Category,Branch Name,Current Stock,Unit Cost,Selling Price (SRP),Reorder Level\n";

    private MockMultipartFile csv(String body) {
        return new MockMultipartFile(
            "file", "import.csv", "text/csv", (HEADER + body).getBytes(StandardCharsets.UTF_8));
    }

    private Authentication authWithAccount(long accountId) {
        Authentication auth = mock(Authentication.class);
        Claims claims = mock(Claims.class);
        when(auth.getDetails()).thenReturn(claims);
        when(jwtService.extractAccountId(claims)).thenReturn(accountId);
        return auth;
    }

    @Test
    void previewFlagsAnUnmatchedRowWithMissingCategoryInsteadOfSilentlyCreating() {
        when(productRepository.findAllById(any())).thenReturn(List.of());
        when(productRepository.findByActiveTrueAndNameIgnoreCaseIn(any())).thenReturn(List.of());
        when(stockLevelRepository.findByBranchId(branch.getId())).thenReturn(List.of());
        when(productCostService.latestKnownCosts(any())).thenReturn(Map.of());

        MockMultipartFile file = csv(",Brand New Widget,,,10,150,999,2\n");
        InventoryImportPreviewResponse preview = service.preview(file, branch);

        assertThat(preview.validCount()).isZero();
        assertThat(preview.rows().get(0).valid()).isFalse();
        assertThat(preview.rows().get(0).reason()).contains("Category");
    }

    @Test
    void previewAcceptsAnUnmatchedRowWithValidCreationFields() {
        when(productRepository.findAllById(any())).thenReturn(List.of());
        when(productRepository.findByActiveTrueAndNameIgnoreCaseIn(any())).thenReturn(List.of());
        when(stockLevelRepository.findByBranchId(branch.getId())).thenReturn(List.of());
        when(productCostService.latestKnownCosts(any())).thenReturn(Map.of());

        MockMultipartFile file = csv(",Brand New Widget,CARB,,10,150,999,2\n");
        InventoryImportPreviewResponse preview = service.preview(file, branch);

        assertThat(preview.validCount()).isEqualTo(1);
        InventoryImportRowResult row = preview.rows().get(0);
        assertThat(row.valid()).isTrue();
        assertThat(row.created()).isTrue();
        assertThat(row.currentQuantity()).isZero();
        assertThat(row.newQuantity()).isEqualTo(10);
    }

    @Test
    void rejectsCreatingANewServicesCategoryProduct() {
        when(productRepository.findAllById(any())).thenReturn(List.of());
        when(productRepository.findByActiveTrueAndNameIgnoreCaseIn(any())).thenReturn(List.of());
        when(stockLevelRepository.findByBranchId(branch.getId())).thenReturn(List.of());
        when(productCostService.latestKnownCosts(any())).thenReturn(Map.of());

        MockMultipartFile file = csv(",Oil Change Deluxe,SERVICES,,0,,500,0\n");
        InventoryImportPreviewResponse preview = service.preview(file, branch);

        assertThat(preview.validCount()).isZero();
        assertThat(preview.rows().get(0).reason()).contains("aren't stock-tracked");
    }

    @Test
    void parsesUnitCostThroughCurrencySymbolAndCommasAndTreatsPlaceholdersAsAbsent() {
        Product product = Product.builder()
            .id(5L).name("Spark Plug").category(Category.CARB).unitPrice(BigDecimal.valueOf(120)).active(true)
            .build();
        when(productRepository.findAllById(any())).thenReturn(List.of(product));
        when(productRepository.findByActiveTrueAndNameIgnoreCaseIn(any())).thenReturn(List.of());
        when(stockLevelRepository.findByBranchId(branch.getId())).thenReturn(List.of());
        when(productCostService.latestKnownCosts(any())).thenReturn(Map.of());

        // Two separate single-row files (not one two-row file) so each parse
        // is independent - the currency value is CSV-quoted since it contains
        // a thousands-separator comma.
        MockMultipartFile currencyRow = csv("5,Spark Plug,,,20,\"₱1,500.50\",600,3\n");
        MockMultipartFile placeholderRow = csv("5,Spark Plug,,,20,N/A,,3\n");

        InventoryImportPreviewResponse currencyPreview = service.preview(currencyRow, branch);
        assertThat(currencyPreview.validCount()).isEqualTo(1);

        InventoryImportPreviewResponse placeholderPreview = service.preview(placeholderRow, branch);
        assertThat(placeholderPreview.validCount()).isEqualTo(1);
    }

    @Test
    void commitWritesAnAdjustmentReceiptOnlyWhenUnitCostActuallyChanged() {
        Product unchanged = Product.builder()
            .id(1L).name("Unchanged Cost Item").category(Category.CARB).unitPrice(BigDecimal.valueOf(100))
            .active(true).build();
        Product changed = Product.builder()
            .id(2L).name("Changed Cost Item").category(Category.CARB).unitPrice(BigDecimal.valueOf(200))
            .active(true).build();
        when(productRepository.findAllById(any())).thenReturn(List.of(unchanged, changed));
        when(productRepository.findByActiveTrueAndNameIgnoreCaseIn(any())).thenReturn(List.of());
        when(stockLevelRepository.findByBranchId(branch.getId())).thenReturn(List.of());
        when(productCostService.latestKnownCosts(any())).thenReturn(
            Map.of(1L, BigDecimal.valueOf(50), 2L, BigDecimal.valueOf(50)));
        when(accountRepository.getReferenceById(any())).thenReturn(Account.builder().id(9L).build());
        when(supplierRepository.findByNameIgnoreCase(any())).thenReturn(Optional.empty());
        when(supplierRepository.save(any())).thenAnswer(inv -> {
            Supplier s = inv.getArgument(0);
            s.setId(77L);
            return s;
        });
        when(stockInRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(stockLevelRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        MockMultipartFile file = csv(
            "1,Unchanged Cost Item,,,10,50,,2\n" + "2,Changed Cost Item,,,10,75,,2\n");

        service.commit(file, branch, authWithAccount(9L));

        verify(stockInLineRepository).save(any());
        assertThat(stockInLineCallCount()).isEqualTo(1);
    }

    private int stockInLineCallCount() {
        return org.mockito.Mockito.mockingDetails(stockInLineRepository).getInvocations().stream()
            .filter(inv -> inv.getMethod().getName().equals("save"))
            .toList()
            .size();
    }

    @Test
    void rejectsAmbiguousProductNameMatch() {
        Product a = Product.builder().id(1L).name("Duplicate Name").category(Category.CARB).active(true).build();
        Product b = Product.builder().id(2L).name("Duplicate Name").category(Category.CARB).active(true).build();
        when(productRepository.findAllById(any())).thenReturn(List.of());
        when(productRepository.findByActiveTrueAndNameIgnoreCaseIn(any())).thenReturn(List.of(a, b));
        when(stockLevelRepository.findByBranchId(branch.getId())).thenReturn(List.of());
        when(productCostService.latestKnownCosts(any())).thenReturn(Map.of());

        MockMultipartFile file = csv(",Duplicate Name,,,5,,,1\n");
        InventoryImportPreviewResponse preview = service.preview(file, branch);

        assertThat(preview.validCount()).isZero();
        assertThat(preview.rows().get(0).reason()).contains("Multiple products");
    }

    @Test
    void rejectsAFileWithoutTheRequiredHeaders() {
        MockMultipartFile file = new MockMultipartFile(
            "file", "bad.csv", "text/csv", "Wrong,Headers\nfoo,bar\n".getBytes(StandardCharsets.UTF_8));

        try {
            service.preview(file, branch);
            assert false : "expected ResponseStatusException";
        } catch (ResponseStatusException e) {
            assertThat(e.getReason()).contains("Expected columns");
        }
    }
}
