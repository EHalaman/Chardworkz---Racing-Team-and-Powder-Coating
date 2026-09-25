package com.chardworkz.backend.realtime;

import java.time.Instant;
import java.util.UUID;

/**
 * Published by SaleService#recordSale on the genuine first-time persistence
 * path only (never on an alreadySynced replay) - see
 * docs/realtime-sales-sync-spec-2026-09-25.md. Deliberately minimal: no
 * totalAmount, payment method, or SKU/stock fields. A subscriber refetches
 * its own already-role-scoped data through the normal REST endpoints
 * instead of receiving a push payload that would have to duplicate (and
 * could drift from) that role-based redaction.
 */
public record SaleCreatedEvent(String branchCode, UUID saleId, Instant soldAt) {}
