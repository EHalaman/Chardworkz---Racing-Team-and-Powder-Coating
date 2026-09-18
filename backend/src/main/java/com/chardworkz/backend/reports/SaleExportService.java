package com.chardworkz.backend.reports;

import com.chardworkz.backend.sales.Sale;
import com.chardworkz.backend.sales.SaleLine;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.UncheckedIOException;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellStyle;
import org.apache.poi.ss.usermodel.Font;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.util.WorkbookUtil;
import org.apache.poi.xssf.streaming.SXSSFSheet;
import org.apache.poi.xssf.streaming.SXSSFWorkbook;
import org.springframework.stereotype.Service;

/**
 * Builds the Sales Report .xlsx export ({@code GET /api/reports/sales/export}).
 * Uses {@link SXSSFWorkbook} (POI's streaming writer, flushing completed rows
 * to a compressed temp file rather than holding the whole sheet as an in-memory
 * DOM) since the export is intentionally uncapped and can cover this app's
 * entire sales history, not just the on-screen top-20 recent-sales list.
 */
@Service
public class SaleExportService {

    private static final DateTimeFormatter DATE_TIME_FORMAT =
        DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");
    private static final String[] HEADERS = {
        "Transaction ID", "Date & Time", "Branch Name", "Cashier Name", "Customer Name",
        "Phone Number", "Email", "Items Purchased", "Payment Method", "Total Amount (₱)",
    };
    private static final int STREAMING_WINDOW_ROWS = 100;

    public byte[] toXlsx(
        List<Sale> sales, Map<UUID, String> transactionNumbers, Map<UUID, List<SaleLine>> linesBySaleId) {
        try (SXSSFWorkbook workbook = new SXSSFWorkbook(STREAMING_WINDOW_ROWS)) {
            SXSSFSheet sheet = workbook.createSheet(WorkbookUtil.createSafeSheetName("Sales Report"));
            CellStyle headerStyle = headerStyle(workbook);

            Row headerRow = sheet.createRow(0);
            for (int col = 0; col < HEADERS.length; col++) {
                Cell cell = headerRow.createCell(col);
                cell.setCellValue(HEADERS[col]);
                cell.setCellStyle(headerStyle);
            }

            ZoneId zone = ZoneId.systemDefault();
            int rowNum = 1;
            for (Sale sale : sales) {
                Row row = sheet.createRow(rowNum++);
                row.createCell(0).setCellValue(transactionNumbers.get(sale.getId()));
                row.createCell(1).setCellValue(DATE_TIME_FORMAT.format(sale.getSoldAt().atZone(zone)));
                row.createCell(2).setCellValue(sale.getBranch().getName());
                row.createCell(3).setCellValue(sale.getEmployee().getFullName());
                row.createCell(4).setCellValue(sale.getCustomerName() != null ? sale.getCustomerName() : "");
                row.createCell(5).setCellValue(sale.getCustomerPhone() != null ? sale.getCustomerPhone() : "");
                row.createCell(6).setCellValue(sale.getCustomerEmail() != null ? sale.getCustomerEmail() : "");
                row.createCell(7).setCellValue(itemsPurchased(linesBySaleId.get(sale.getId())));
                row.createCell(8).setCellValue(sale.getPaymentMethod().name());
                row.createCell(9).setCellValue(sale.getTotal().doubleValue());
            }

            for (int col = 0; col < HEADERS.length; col++) {
                sheet.trackColumnForAutoSizing(col);
                sheet.autoSizeColumn(col);
            }

            ByteArrayOutputStream out = new ByteArrayOutputStream();
            workbook.write(out);
            workbook.dispose();
            return out.toByteArray();
        } catch (IOException e) {
            throw new UncheckedIOException("Failed to build sales report export", e);
        }
    }

    /** e.g. "2x Piston Ring Set, 1x Full Engine Overhaul Labor" - no stored column, joined at export time. */
    private String itemsPurchased(List<SaleLine> lines) {
        if (lines == null || lines.isEmpty()) {
            return "";
        }
        return lines.stream()
            .map(line -> line.getQuantity() + "x " + line.getProduct().getName())
            .collect(Collectors.joining(", "));
    }

    private CellStyle headerStyle(SXSSFWorkbook workbook) {
        Font boldFont = workbook.createFont();
        boldFont.setBold(true);
        CellStyle style = workbook.createCellStyle();
        style.setFont(boldFont);
        return style;
    }
}
