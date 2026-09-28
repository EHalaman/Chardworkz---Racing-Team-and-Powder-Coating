package com.chardworkz.backend.sales;

import com.chardworkz.backend.catalog.Category;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * Full line-item detail for the printable receipt / "Recent Transactions"
 * reprint - distinct from {@link ShiftSummaryResponse}, which is aggregate
 * totals only. {@code transactionNumber} is a display-only, human-friendly
 * label (e.g. "TXN-20260916-0004"), not a real business key - {@code id} (the
 * sale's actual UUID) remains the only real identity. It's derived from this
 * sale's ordinal position among the branch's sales that same day, so a
 * concurrent register completing a sale at nearly the same moment could in
 * principle land on the same number - acceptable for a printed customer
 * receipt, not used for any lookup.
 */
public record SaleReceiptResponse(
    UUID id,
    String transactionNumber,
    String customerName,
    String customerPhone,
    String customerEmail,
    String branchName,
    String employeeName,
    Instant soldAt,
    String paymentMethod,
    String paymentReference,
    String remarks,
    BigDecimal subtotal,
    BigDecimal total,
    List<ReceiptLine> lines) {

    /** {@code packageId}/{@code packageName} are null for a plain individually-added line - only set for a line that came from a package selection (migration V24), so the printable receipt's Customer tab can group them. */
    public record ReceiptLine(
        String productName,
        Category category,
        int quantity,
        BigDecimal unitPrice,
        BigDecimal lineTotal,
        Long packageId,
        String packageName) {}
}
