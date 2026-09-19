package com.chardworkz.backend.inventory;

import com.chardworkz.backend.supplier.StockInLine;
import java.math.BigDecimal;
import java.time.Instant;

public record StockReceiptResponse(
    Long id,
    String productName,
    int quantity,
    BigDecimal unitCost,
    BigDecimal totalCost,
    String supplierName,
    String referenceNo,
    Instant receivedAt,
    Long receivedById,
    String receivedByName,
    String delivererName,
    String delivererContact) {

    static StockReceiptResponse from(StockInLine line) {
        return new StockReceiptResponse(
            line.getId(),
            line.getProduct().getName(),
            line.getQuantity(),
            line.getUnitCost(),
            line.getUnitCost().multiply(BigDecimal.valueOf(line.getQuantity())),
            line.getStockIn().getSupplier().getName(),
            line.getStockIn().getReferenceNo(),
            line.getStockIn().getReceivedAt(),
            line.getStockIn().getReceivedBy().getId(),
            line.getStockIn().getReceivedBy().getFullName(),
            line.getStockIn().getDelivererName(),
            line.getStockIn().getDelivererContact());
    }
}
