package com.chardworkz.backend.inventory;

import com.chardworkz.backend.account.Account;
import com.chardworkz.backend.account.AccountRepository;
import com.chardworkz.backend.audit.ActionType;
import com.chardworkz.backend.audit.ActivityLogService;
import com.chardworkz.backend.branch.Branch;
import com.chardworkz.backend.catalog.Category;
import com.chardworkz.backend.catalog.Product;
import com.chardworkz.backend.catalog.ProductCostService;
import com.chardworkz.backend.catalog.ProductRepository;
import com.chardworkz.backend.security.JwtService;
import com.chardworkz.backend.supplier.StockIn;
import com.chardworkz.backend.supplier.StockInLine;
import com.chardworkz.backend.supplier.StockInLineRepository;
import com.chardworkz.backend.supplier.StockInRepository;
import com.chardworkz.backend.supplier.Supplier;
import com.chardworkz.backend.supplier.SupplierRepository;
import io.jsonwebtoken.Claims;
import java.io.IOException;
import java.io.InputStreamReader;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVRecord;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellType;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.ss.usermodel.WorkbookFactory;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

/**
 * Parses an uploaded Inventory .xlsx/.csv (the same column shape {@link
 * InventoryExportService} produces) and upserts one branch's stock. "Product
 * ID"/"Product Name", "Current Stock", and "Reorder Level" are required on
 * every row, same absolute-SET semantics as before (overwrites {@code
 * stock_level}, not an additive delivery). "Category" and "Selling Price
 * (SRP)" are only required when a row creates a brand-new product (no
 * durable per-product column for these being wrong is a corruption risk
 * that's not worth relaxing). "Unit Cost" stays reference-only in the sense
 * that it is never written to any {@code product}/{@code stock_level}
 * column (DEC-058: no such column exists) - instead, a changed Unit Cost
 * writes a new {@code stock_in}/{@code stock_in_line} adjustment receipt, so
 * {@link com.chardworkz.backend.catalog.ProductCostService}'s existing
 * "latest known receipt cost" lookup picks it up everywhere (export,
 * dashboard margin) without inventing an untracked column.
 */
@Service
@RequiredArgsConstructor
public class InventoryImportService {

    private static final String ADJUSTMENT_SUPPLIER_NAME = "Inventory Import Adjustment";
    private static final String ADJUSTMENT_REFERENCE_NO = "EXCEL-IMPORT";

    private final ProductRepository productRepository;
    private final StockLevelRepository stockLevelRepository;
    private final ActivityLogService activityLogService;
    private final ProductCostService productCostService;
    private final StockInRepository stockInRepository;
    private final StockInLineRepository stockInLineRepository;
    private final SupplierRepository supplierRepository;
    private final AccountRepository accountRepository;
    private final JwtService jwtService;

    public InventoryImportPreviewResponse preview(MultipartFile file, Branch branch) {
        return toPreview(parse(file, branch));
    }

    @Transactional
    public InventoryImportCommitResponse commit(MultipartFile file, Branch branch, Authentication authentication) {
        List<ResolvedRow> rows = parse(file, branch);
        Account receivedBy = accountRepository.getReferenceById(callerAccountId(authentication));
        Supplier adjustmentSupplier = null;

        int created = 0;
        int updated = 0;
        for (ResolvedRow row : rows) {
            if (!row.result().valid()) {
                continue;
            }

            Product product = row.product();
            if (row.createProduct()) {
                product = productRepository.save(product);
                created++;
            } else {
                if (row.newSellingPrice() != null) {
                    product.setUnitPrice(row.newSellingPrice());
                    product.setUpdatedAt(Instant.now());
                    productRepository.save(product);
                }
                updated++;
            }

            StockLevel stockLevel = row.stockLevel();
            stockLevel.setProduct(product);
            stockLevel.setQuantity(row.result().newQuantity());
            stockLevel.setReorderThreshold(row.result().newReorderThreshold());
            stockLevel.setUpdatedAt(Instant.now());
            stockLevelRepository.save(stockLevel);

            if (row.costToRecord() != null) {
                if (adjustmentSupplier == null) {
                    adjustmentSupplier = resolveAdjustmentSupplier();
                }
                StockIn stockIn = stockInRepository.save(StockIn.builder()
                    .supplier(adjustmentSupplier)
                    .branch(branch)
                    .receivedBy(receivedBy)
                    .referenceNo(ADJUSTMENT_REFERENCE_NO)
                    .receivedAt(Instant.now())
                    .build());
                stockInLineRepository.save(StockInLine.builder()
                    .stockIn(stockIn)
                    .product(product)
                    .quantity(Math.max(stockLevel.getQuantity(), 1))
                    .unitCost(row.costToRecord())
                    .build());
            }
        }
        int totalApplied = created + updated;
        int skipped = rows.size() - totalApplied;

        if (totalApplied > 0) {
            StringBuilder message = new StringBuilder("Excel import at ").append(branch.getName()).append(": ");
            message.append(updated).append(" product(s) updated");
            if (created > 0) {
                message.append(", ").append(created).append(" product(s) created");
            }
            if (skipped > 0) {
                message.append(", ").append(skipped).append(" row(s) skipped");
            }
            activityLogService.record(
                authentication, ActionType.EXCEL_IMPORT, "INVENTORY", null, branch.getId(), message.toString());
        }

        return new InventoryImportCommitResponse(updated, created, skipped);
    }

    private Supplier resolveAdjustmentSupplier() {
        return supplierRepository.findByNameIgnoreCase(ADJUSTMENT_SUPPLIER_NAME)
            .orElseGet(() -> supplierRepository.save(Supplier.builder()
                .name(ADJUSTMENT_SUPPLIER_NAME)
                .contactInfo("System-generated - Inventory Excel import Unit Cost adjustments")
                .createdAt(Instant.now())
                .build()));
    }

    private record RawRow(
        String productId, String productName, String currentStock, String reorderLevel, String category,
        String sellingPrice, String unitCost) {}

    private record ResolvedRow(
        InventoryImportRowResult result, StockLevel stockLevel, Product product, boolean createProduct,
        BigDecimal newSellingPrice, BigDecimal costToRecord) {}

    private List<ResolvedRow> parse(MultipartFile file, Branch branch) {
        List<List<String>> allRows = isCsv(file) ? readCsvRows(file) : readXlsxRows(file);
        List<RawRow> rawRows = toRawRows(allRows);

        // Batch every row's product/stock-level lookup into a handful of queries
        // instead of resolveRow() hitting the DB per row - see DEC-058's own
        // review follow-up.
        Set<Long> ids = new HashSet<>();
        Set<String> names = new HashSet<>();
        for (RawRow raw : rawRows) {
            if (!raw.productId().isBlank()) {
                try {
                    ids.add(Long.parseLong(raw.productId()));
                } catch (NumberFormatException e) {
                    // resolveRow() reports the "not a valid number" reason for this row itself.
                }
            } else if (!raw.productName().isBlank()) {
                names.add(raw.productName());
            }
        }

        Map<Long, Product> productsById =
            productRepository.findAllById(ids).stream().collect(Collectors.toMap(Product::getId, p -> p));
        Map<String, List<Product>> productsByNameLower = names.isEmpty()
            ? Map.of()
            : productRepository.findByActiveTrueAndNameIgnoreCaseIn(names).stream()
                .collect(Collectors.groupingBy(p -> p.getName().toLowerCase(Locale.ROOT)));
        Map<Long, StockLevel> stockLevelsByProductId = stockLevelRepository.findByBranchId(branch.getId()).stream()
            .collect(Collectors.toMap(sl -> sl.getProduct().getId(), sl -> sl));

        // Every product this file could possibly touch, so the "did Unit Cost
        // actually change" comparison below is a single batched lookup rather
        // than one query per row.
        Set<Long> allReferencedProductIds = new HashSet<>(productsById.keySet());
        productsByNameLower.values().forEach(matches -> matches.forEach(p -> allReferencedProductIds.add(p.getId())));
        Map<Long, BigDecimal> latestCostsByProductId = productCostService.latestKnownCosts(allReferencedProductIds);

        List<ResolvedRow> resolved = new ArrayList<>();
        int rowNumber = 1;
        for (RawRow raw : rawRows) {
            resolved.add(resolveRow(
                rowNumber++, raw, branch, productsById, productsByNameLower, stockLevelsByProductId,
                latestCostsByProductId));
        }
        return resolved;
    }

    private boolean isCsv(MultipartFile file) {
        String name = file.getOriginalFilename();
        return name != null && name.toLowerCase(Locale.ROOT).endsWith(".csv");
    }

    private List<List<String>> readXlsxRows(MultipartFile file) {
        try (Workbook workbook = WorkbookFactory.create(file.getInputStream())) {
            Sheet sheet = workbook.getSheetAt(0);
            List<List<String>> rows = new ArrayList<>();
            for (Row row : sheet) {
                List<String> cells = new ArrayList<>();
                short lastCol = row.getLastCellNum();
                for (int c = 0; c < lastCol; c++) {
                    cells.add(cellToString(row.getCell(c)));
                }
                rows.add(cells);
            }
            return rows;
        } catch (IOException | RuntimeException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Could not read the uploaded .xlsx file");
        }
    }

    private String cellToString(Cell cell) {
        if (cell == null) {
            return "";
        }
        if (cell.getCellType() == CellType.NUMERIC) {
            double value = cell.getNumericCellValue();
            return value == Math.floor(value) ? String.valueOf((long) value) : String.valueOf(value);
        }
        return cell.toString().trim();
    }

    private List<List<String>> readCsvRows(MultipartFile file) {
        try (InputStreamReader reader = new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8)) {
            CSVParser parser = CSVFormat.DEFAULT.builder().setIgnoreSurroundingSpaces(true).build().parse(reader);
            List<List<String>> rows = new ArrayList<>();
            for (CSVRecord record : parser) {
                List<String> cells = new ArrayList<>();
                record.forEach(cells::add);
                rows.add(cells);
            }
            return rows;
        } catch (IOException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Could not read the uploaded .csv file");
        }
    }

    private List<RawRow> toRawRows(List<List<String>> allRows) {
        if (allRows.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "The uploaded file is empty");
        }
        List<String> header = allRows.get(0);
        int idCol = findColumn(header, "product id");
        int nameCol = findColumn(header, "product name");
        int stockCol = findColumn(header, "current stock");
        int reorderCol = findColumn(header, "reorder level");
        int categoryCol = findColumn(header, "category");
        int sellingPriceCol = findColumn(header, "selling price (srp)");
        int unitCostCol = findColumn(header, "unit cost");
        if (nameCol < 0 || stockCol < 0 || reorderCol < 0) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Expected columns \"Product Name\", \"Current Stock\", and \"Reorder Level\" - "
                    + "use the file from \"Export Inventory\" and edit that, rather than a new one.");
        }

        List<RawRow> rows = new ArrayList<>();
        for (int i = 1; i < allRows.size(); i++) {
            List<String> row = allRows.get(i);
            if (row.stream().allMatch(String::isBlank)) {
                continue;
            }
            rows.add(new RawRow(
                idCol >= 0 ? cellAt(row, idCol) : "", cellAt(row, nameCol), cellAt(row, stockCol),
                cellAt(row, reorderCol), categoryCol >= 0 ? cellAt(row, categoryCol) : "",
                sellingPriceCol >= 0 ? cellAt(row, sellingPriceCol) : "",
                unitCostCol >= 0 ? cellAt(row, unitCostCol) : ""));
        }
        return rows;
    }

    private String cellAt(List<String> row, int index) {
        return index < row.size() ? row.get(index).trim() : "";
    }

    private int findColumn(List<String> header, String target) {
        for (int i = 0; i < header.size(); i++) {
            if (header.get(i).trim().equalsIgnoreCase(target)) {
                return i;
            }
        }
        return -1;
    }

    private ResolvedRow resolveRow(
        int rowNumber, RawRow raw, Branch branch, Map<Long, Product> productsById,
        Map<String, List<Product>> productsByNameLower, Map<Long, StockLevel> stockLevelsByProductId,
        Map<Long, BigDecimal> latestCostsByProductId) {
        Product product = null;
        String reason = null;
        boolean idOrNameProvided = !raw.productId().isBlank() || !raw.productName().isBlank();

        if (!raw.productId().isBlank()) {
            try {
                Long id = Long.parseLong(raw.productId());
                product = productsById.get(id);
            } catch (NumberFormatException e) {
                reason = "Product ID \"" + raw.productId() + "\" is not a valid number";
            }
        } else if (!raw.productName().isBlank()) {
            List<Product> matches =
                productsByNameLower.getOrDefault(raw.productName().toLowerCase(Locale.ROOT), List.of());
            if (matches.size() > 1) {
                reason = "Multiple products are named \"" + raw.productName() + "\" - specify Product ID instead";
            } else if (matches.size() == 1) {
                product = matches.get(0);
            }
            // Zero matches falls through to the creation path below, not an error.
        } else {
            reason = "Row has neither a Product ID nor a Product Name";
        }

        if (reason == null && product != null && product.getCategory() == Category.SERVICES) {
            reason = "\"" + product.getName() + "\" is a service item - not stock-tracked";
            product = null;
        } else if (reason == null && product != null && !product.isActive()) {
            reason = "\"" + product.getName() + "\" is deactivated";
            product = null;
        }

        boolean createProduct = false;
        BigDecimal newSellingPriceForExisting = null;
        BigDecimal parsedSellingPriceForCreation = null;

        if (reason == null && product == null && idOrNameProvided) {
            if (raw.productName().isBlank()) {
                reason = "No product found with Product ID " + raw.productId()
                    + " - Product Name is required to create a new product";
            } else {
                Category category = parseCategory(raw.category());
                if (category == null) {
                    reason = "Missing or invalid Category \"" + raw.category()
                        + "\" - required to create a new product (CARB, FI, OTHERS, or SERVICES)";
                } else if (category == Category.SERVICES) {
                    reason = "\"" + raw.productName()
                        + "\" is category SERVICES - service items aren't stock-tracked, add via Products instead";
                } else {
                    BigDecimal sellingPrice = parseOptionalMoney(raw.sellingPrice());
                    if (sellingPrice == null || sellingPrice.signum() <= 0) {
                        reason = "Missing or invalid Selling Price (SRP) \"" + raw.sellingPrice()
                            + "\" - required to create a new product";
                    } else {
                        createProduct = true;
                        parsedSellingPriceForCreation = sellingPrice;
                    }
                }
            }
        } else if (reason == null && product != null) {
            BigDecimal sellingPrice = parseOptionalMoney(raw.sellingPrice());
            if (sellingPrice != null && sellingPrice.signum() > 0
                && sellingPrice.compareTo(product.getUnitPrice()) != 0) {
                newSellingPriceForExisting = sellingPrice;
            }
        }

        Integer newQuantity = null;
        Integer newReorderThreshold = null;
        if (reason == null) {
            newQuantity = parseNonNegativeInt(raw.currentStock());
            if (newQuantity == null) {
                reason = "Current Stock \"" + raw.currentStock() + "\" is not a non-negative whole number";
            }
        }
        if (reason == null) {
            newReorderThreshold = parseNonNegativeInt(raw.reorderLevel());
            if (newReorderThreshold == null) {
                reason = "Reorder Level \"" + raw.reorderLevel() + "\" is not a non-negative whole number";
            }
        }

        if (reason != null) {
            return new ResolvedRow(
                new InventoryImportRowResult(
                    rowNumber, product != null ? product.getId() : null,
                    product != null ? product.getName() : raw.productName(), null, null, null, null, false, false,
                    reason),
                null, null, false, null, null);
        }

        BigDecimal unitCost = parseOptionalMoney(raw.unitCost());
        BigDecimal costToRecord = null;
        if (unitCost != null && unitCost.signum() >= 0) {
            if (createProduct) {
                costToRecord = unitCost;
            } else {
                BigDecimal knownCost = latestCostsByProductId.get(product.getId());
                if (knownCost == null || knownCost.compareTo(unitCost) != 0) {
                    costToRecord = unitCost;
                }
            }
        }

        Product resolvedProduct = createProduct
            ? Product.builder()
                .name(raw.productName()).category(parseCategory(raw.category())).unitPrice(
                    parsedSellingPriceForCreation)
                .active(true).createdAt(Instant.now()).updatedAt(Instant.now()).build()
            : product;

        StockLevel existing = createProduct ? null : stockLevelsByProductId.get(product.getId());
        StockLevel stockLevel = existing != null
            ? existing
            : StockLevel.builder()
                .product(resolvedProduct).branch(branch).quantity(0).reorderThreshold(0)
                .updatedAt(Instant.now()).build();

        InventoryImportRowResult result = new InventoryImportRowResult(
            rowNumber, createProduct ? null : product.getId(), raw.productName(),
            existing != null ? existing.getQuantity() : 0, newQuantity,
            existing != null ? existing.getReorderThreshold() : 0, newReorderThreshold, true, createProduct, null);
        return new ResolvedRow(
            result, stockLevel, resolvedProduct, createProduct, newSellingPriceForExisting, costToRecord);
    }

    private Category parseCategory(String raw) {
        if (raw == null || raw.isBlank()) {
            return null;
        }
        try {
            return Category.valueOf(raw.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException e) {
            return null;
        }
    }

    private Integer parseNonNegativeInt(String raw) {
        if (raw == null || raw.isBlank()) {
            return null;
        }
        try {
            double value = Double.parseDouble(raw);
            if (value < 0 || value != Math.floor(value) || value > Integer.MAX_VALUE) {
                return null;
            }
            return (int) value;
        } catch (NumberFormatException e) {
            return null;
        }
    }

    /**
     * Blank, "N/A", "—", "-" (any case/spacing) mean "no value provided" -
     * returns {@code null}, not an error, since Unit Cost/Selling Price are
     * often genuinely unknown for existing rows. Strips a leading currency
     * symbol (₱ or "PHP") and thousands-separator commas before parsing.
     * Anything else that still fails to parse as a number is also treated as
     * "no value" rather than rejecting the whole row - only the two
     * new-product creation fields (Category, Selling Price) are ever
     * mandatory, and those are checked separately by their callers.
     */
    private BigDecimal parseOptionalMoney(String raw) {
        if (raw == null) {
            return null;
        }
        String trimmed = raw.trim();
        if (trimmed.isEmpty()) {
            return null;
        }
        String normalized = trimmed.toUpperCase(Locale.ROOT);
        if (normalized.equals("N/A") || normalized.equals("—") || normalized.equals("-")) {
            return null;
        }
        String cleaned = trimmed.replace("₱", "").replaceAll("(?i)^PHP\\s*", "").replace(",", "").trim();
        if (cleaned.isEmpty()) {
            return null;
        }
        try {
            BigDecimal value = new BigDecimal(cleaned);
            return value.signum() < 0 ? null : value;
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private Long callerAccountId(Authentication authentication) {
        return jwtService.extractAccountId((Claims) authentication.getDetails());
    }

    private InventoryImportPreviewResponse toPreview(List<ResolvedRow> rows) {
        List<InventoryImportRowResult> results = rows.stream().map(ResolvedRow::result).toList();
        int validCount = (int) results.stream().filter(InventoryImportRowResult::valid).count();
        return new InventoryImportPreviewResponse(results, validCount, results.size() - validCount);
    }
}
