package com.chardworkz.backend.inventory;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

/**
 * {@code branchCode} is honored for Owner only - Manager is always forced to
 * their own branch. {@code delivererName}/{@code delivererContact} are
 * optional (migration V12) - who physically drops off a delivery isn't
 * always known or the same as the supplier on file. {@code @Size} bounds
 * match {@code stock_in}'s column widths (V12).
 */
public record ReceiveStockRequest(
    @NotNull Long productId,
    @Min(1) int quantity,
    @NotNull @DecimalMin("0") BigDecimal unitCost,
    @NotBlank String supplierName,
    String referenceNo,
    String branchCode,
    @Size(max = 150) String delivererName,
    @Size(max = 50) String delivererContact) {}
