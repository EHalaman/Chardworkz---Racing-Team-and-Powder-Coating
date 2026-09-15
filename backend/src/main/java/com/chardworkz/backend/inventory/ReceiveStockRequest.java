package com.chardworkz.backend.inventory;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

/** {@code branchCode} is honored for Owner only - Manager is always forced to their own branch. */
public record ReceiveStockRequest(
    @NotNull Long productId,
    @Min(1) int quantity,
    @NotNull @DecimalMin("0") BigDecimal unitCost,
    @NotBlank String supplierName,
    String referenceNo,
    String branchCode) {}
