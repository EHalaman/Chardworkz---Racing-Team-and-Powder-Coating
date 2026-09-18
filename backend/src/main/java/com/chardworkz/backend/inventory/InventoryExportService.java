package com.chardworkz.backend.inventory;

import com.chardworkz.backend.branch.Branch;
import com.chardworkz.backend.catalog.Category;
import com.chardworkz.backend.catalog.Product;
import com.chardworkz.backend.supplier.StockInLine;
import com.chardworkz.backend.supplier.StockInLineRepository;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.UncheckedIOException;
import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellStyle;
import org.apache.poi.ss.usermodel.Font;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.util.WorkbookUtil;
import org.apache.poi.xssf.streaming.SXSSFSheet;
import org.apache.poi.xssf.streaming.SXSSFWorkbook;
import org.springframework.stereotype.Service;

/**
 * Builds the Inventory .xlsx export ({@code GET /api/inventory/export}) for
 * one branch at a time - Inventory has no merged "both branches" view (unlike
 * Sales Reports), so this always reflects a single selected branch.
 */
@Service
public class InventoryExportService {

    private static final String[] HEADERS = {
        "Product ID", "Product Name", "Category", "Branch Name", "Current Stock",
        "Unit Cost", "Selling Price (SRP)", "Reorder Level",
    };

    private final StockInLineRepository stockInLineRepository;

    public InventoryExportService(StockInLineRepository stockInLineRepository) {
        this.stockInLineRepository = stockInLineRepository;
    }

    public byte[] toXlsx(List<Product> products, Map<Long, StockLevel> stockLevelsByProductId, Branch branch) {
        Map<Long, BigDecimal> latestCosts = latestKnownCosts(products.stream().map(Product::getId).toList());

        try (SXSSFWorkbook workbook = new SXSSFWorkbook(100)) {
            SXSSFSheet sheet = workbook.createSheet(WorkbookUtil.createSafeSheetName("Inventory"));
            CellStyle headerStyle = headerStyle(workbook);

            Row headerRow = sheet.createRow(0);
            for (int col = 0; col < HEADERS.length; col++) {
                Cell cell = headerRow.createCell(col);
                cell.setCellValue(HEADERS[col]);
                cell.setCellStyle(headerStyle);
            }

            int rowNum = 1;
            for (Product product : products) {
                StockLevel stockLevel = stockLevelsByProductId.get(product.getId());
                BigDecimal cost = latestCosts.get(product.getId());

                Row row = sheet.createRow(rowNum++);
                row.createCell(0).setCellValue(product.getId());
                row.createCell(1).setCellValue(sanitizeForCell(product.getName()));
                row.createCell(2).setCellValue(product.getCategory().name());
                row.createCell(3).setCellValue(sanitizeForCell(branch.getName()));
                row.createCell(4).setCellValue(stockLevel != null ? stockLevel.getQuantity() : 0);
                Cell costCell = row.createCell(5);
                if (cost != null) {
                    costCell.setCellValue(cost.doubleValue());
                } else {
                    costCell.setCellValue("N/A");
                }
                row.createCell(6).setCellValue(product.getUnitPrice().doubleValue());
                row.createCell(7).setCellValue(stockLevel != null ? stockLevel.getReorderThreshold() : 0);
            }

            safeAutoSizeColumns(sheet, HEADERS.length);

            ByteArrayOutputStream out = new ByteArrayOutputStream();
            workbook.write(out);
            workbook.dispose();
            return out.toByteArray();
        } catch (IOException e) {
            throw new UncheckedIOException("Failed to build inventory export", e);
        }
    }

    /** Same "most recent receipt cost, across all branches" approximation as ShiftSummary/Dashboard - no FIFO/weighted-average costing exists, and cost isn't scoped per-branch anywhere else either. */
    private Map<Long, BigDecimal> latestKnownCosts(List<Long> productIds) {
        if (productIds.isEmpty()) {
            return Map.of();
        }
        Map<Long, StockInLine> latestByProductId = new HashMap<>();
        for (StockInLine line : stockInLineRepository.findByProduct_IdIn(productIds)) {
            latestByProductId.merge(
                line.getProduct().getId(), line,
                (a, b) -> a.getStockIn().getReceivedAt().isAfter(b.getStockIn().getReceivedAt()) ? a : b);
        }
        Map<Long, BigDecimal> costs = new HashMap<>();
        latestByProductId.forEach((productId, line) -> costs.put(productId, line.getUnitCost()));
        return costs;
    }

    private CellStyle headerStyle(SXSSFWorkbook workbook) {
        Font boldFont = workbook.createFont();
        boldFont.setBold(true);
        CellStyle style = workbook.createCellStyle();
        style.setFont(boldFont);
        return style;
    }

    /**
     * Prefixes a leading formula-trigger character ({@code = + - @} or a tab/CR)
     * with a single quote so spreadsheet apps render the value as literal text
     * instead of a formula. Product names are staff-entered (lower risk than
     * customer-supplied text) but sanitized anyway for defense in depth.
     */
    static String sanitizeForCell(String input) {
        if (input == null || input.isBlank()) {
            return "";
        }
        String trimmed = input.trim();
        return trimmed.matches("^[=+\\-@\\t\\r].*") ? "'" + trimmed : trimmed;
    }

    /**
     * {@link org.apache.poi.ss.usermodel.Sheet#autoSizeColumn} needs AWT font
     * metrics, which can throw on headless/fontless production JVMs (this app's
     * Railway target). Falls back to a fixed width rather than letting the whole
     * export fail if that happens.
     */
    static void safeAutoSizeColumns(SXSSFSheet sheet, int columnCount) {
        try {
            for (int col = 0; col < columnCount; col++) {
                sheet.trackColumnForAutoSizing(col);
                sheet.autoSizeColumn(col);
            }
        } catch (RuntimeException e) {
            for (int col = 0; col < columnCount; col++) {
                sheet.setColumnWidth(col, 4000);
            }
        }
    }
}
