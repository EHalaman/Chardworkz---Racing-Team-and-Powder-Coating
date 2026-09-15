package com.chardworkz.backend.inventory;

import com.chardworkz.backend.supplier.StockInLine;
import java.math.BigDecimal;
import java.time.Instant;

public record StockReceiptResponse(
    Long id,
    String productName,
    int quantity,
    BigDecimal unitCost,
    String supplierName,
    String referenceNo,
    Instant receivedAt,
    String receivedByName) {

    static StockReceiptResponse from(StockInLine line) {
        return new StockReceiptResponse(
            line.getId(),
            line.getProduct().getName(),
            line.getQuantity(),
            line.getUnitCost(),
            line.getStockIn().getSupplier().getName(),
            line.getStockIn().getReferenceNo(),
            line.getStockIn().getReceivedAt(),
            line.getStockIn().getReceivedBy().getFullName());
    }
}
