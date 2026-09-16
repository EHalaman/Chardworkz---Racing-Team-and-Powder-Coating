package com.chardworkz.backend.sales;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * {@code id} is the client-generated UUID assigned by the Angular offline
 * queue at the moment of sale (Q12) - the same id resubmitted on a retried
 * sync must be a no-op, not a duplicate sale. Branch and employee are never
 * taken from the request; they're derived server-side from the JWT.
 */
public record CreateSaleRequest(
    @NotNull UUID id,
    @NotNull PaymentMethod paymentMethod,
    String paymentReference,
    String customerName,
    @NotNull Instant soldAt,
    @NotEmpty List<@Valid CreateSaleLineRequest> lines) {}
