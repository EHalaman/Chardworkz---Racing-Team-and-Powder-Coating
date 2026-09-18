package com.chardworkz.backend.inventory;

import com.chardworkz.backend.audit.ActionType;
import com.chardworkz.backend.audit.ActivityLogService;
import com.chardworkz.backend.branch.Branch;
import com.chardworkz.backend.catalog.Category;
import com.chardworkz.backend.catalog.Product;
import com.chardworkz.backend.catalog.ProductRepository;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
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
 * InventoryExportService} produces) and upserts stock/reorder levels for one
 * branch. Only "Product Name"/"Product ID", "Current Stock", and "Reorder
 * Level" are actionable - Category/Branch Name/Unit Cost/Selling Price are
 * read back as reference only, since none of them are writable per-product
 * facts this endpoint owns (cost in particular has no durable per-product
 * column anywhere in this schema - see {@link InventoryExportService}).
 *
 * <p>Import is an absolute SET, not an additive receipt: the file's Current
 * Stock/Reorder Level values directly overwrite {@code stock_level}, matching
 * a bulk physical-count correction rather than a delivery. This deliberately
 * bypasses the supplier/cost trail a real {@code POST /api/inventory/receive}
 * creates - a documented tradeoff, not an oversight.
 */
@Service
@RequiredArgsConstructor
public class InventoryImportService {

    private final ProductRepository productRepository;
    private final StockLevelRepository stockLevelRepository;
    private final ActivityLogService activityLogService;

    public InventoryImportPreviewResponse preview(MultipartFile file, Branch branch) {
        return toPreview(parse(file, branch));
    }

    @Transactional
    public InventoryImportCommitResponse commit(MultipartFile file, Branch branch, Authentication authentication) {
        List<ResolvedRow> rows = parse(file, branch);

        int updated = 0;
        for (ResolvedRow row : rows) {
            if (!row.result().valid()) {
                continue;
            }
            StockLevel stockLevel = row.stockLevel();
            stockLevel.setQuantity(row.result().newQuantity());
            stockLevel.setReorderThreshold(row.result().newReorderThreshold());
            stockLevel.setUpdatedAt(Instant.now());
            stockLevelRepository.save(stockLevel);
            updated++;
        }
        int skipped = rows.size() - updated;

        if (updated > 0) {
            activityLogService.record(
                authentication,
                ActionType.EXCEL_IMPORT,
                "INVENTORY",
                null,
                branch.getId(),
                "Bulk-updated stock/reorder levels for " + updated + " product(s) at " + branch.getName()
                    + " via Excel import" + (skipped > 0 ? " (" + skipped + " row(s) skipped)" : ""));
        }

        return new InventoryImportCommitResponse(updated, skipped);
    }

    private record RawRow(String productId, String productName, String currentStock, String reorderLevel) {}

    private record ResolvedRow(InventoryImportRowResult result, StockLevel stockLevel) {}

    private List<ResolvedRow> parse(MultipartFile file, Branch branch) {
        List<List<String>> allRows = isCsv(file) ? readCsvRows(file) : readXlsxRows(file);
        List<RawRow> rawRows = toRawRows(allRows);

        List<ResolvedRow> resolved = new ArrayList<>();
        int rowNumber = 1;
        for (RawRow raw : rawRows) {
            resolved.add(resolveRow(rowNumber++, raw, branch));
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
                cellAt(row, reorderCol)));
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

    private ResolvedRow resolveRow(int rowNumber, RawRow raw, Branch branch) {
        Product product = null;
        String reason = null;

        if (!raw.productId().isBlank()) {
            try {
                Long id = Long.parseLong(raw.productId());
                product = productRepository.findById(id).orElse(null);
                if (product == null) {
                    reason = "No product found with Product ID " + raw.productId();
                }
            } catch (NumberFormatException e) {
                reason = "Product ID \"" + raw.productId() + "\" is not a valid number";
            }
        } else if (!raw.productName().isBlank()) {
            List<Product> matches = productRepository.findByActiveTrueAndNameIgnoreCase(raw.productName());
            if (matches.isEmpty()) {
                reason = "No active product named \"" + raw.productName() + "\"";
            } else if (matches.size() > 1) {
                reason = "Multiple products are named \"" + raw.productName() + "\" - specify Product ID instead";
            } else {
                product = matches.get(0);
            }
        } else {
            reason = "Row has neither a Product ID nor a Product Name";
        }

        if (reason == null && product.getCategory() == Category.SERVICES) {
            reason = "\"" + product.getName() + "\" is a service item - not stock-tracked";
            product = null;
        } else if (reason == null && !product.isActive()) {
            reason = "\"" + product.getName() + "\" is deactivated";
            product = null;
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
                    product != null ? product.getName() : raw.productName(), null, null, null, null, false, reason),
                null);
        }

        Product resolvedProduct = product;
        StockLevel stockLevel = stockLevelRepository.findByProductIdAndBranchId(product.getId(), branch.getId())
            .orElseGet(() -> StockLevel.builder()
                .product(resolvedProduct).branch(branch).quantity(0).reorderThreshold(0)
                .updatedAt(Instant.now()).build());

        InventoryImportRowResult result = new InventoryImportRowResult(
            rowNumber, product.getId(), product.getName(), stockLevel.getQuantity(), newQuantity,
            stockLevel.getReorderThreshold(), newReorderThreshold, true, null);
        return new ResolvedRow(result, stockLevel);
    }

    private Integer parseNonNegativeInt(String raw) {
        if (raw == null || raw.isBlank()) {
            return null;
        }
        try {
            double value = Double.parseDouble(raw);
            if (value < 0 || value != Math.floor(value)) {
                return null;
            }
            return (int) value;
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private InventoryImportPreviewResponse toPreview(List<ResolvedRow> rows) {
        List<InventoryImportRowResult> results = rows.stream().map(ResolvedRow::result).toList();
        int validCount = (int) results.stream().filter(InventoryImportRowResult::valid).count();
        return new InventoryImportPreviewResponse(results, validCount, results.size() - validCount);
    }
}
