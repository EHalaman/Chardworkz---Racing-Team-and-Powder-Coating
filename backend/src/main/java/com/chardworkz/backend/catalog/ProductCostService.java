package com.chardworkz.backend.catalog;

import com.chardworkz.backend.supplier.StockInLine;
import com.chardworkz.backend.supplier.StockInLineRepository;
import java.math.BigDecimal;
import java.util.Collection;
import java.util.HashMap;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

/**
 * "Most recently known receipt cost" per product - the one cost approximation
 * this app uses everywhere (Dashboard, Inventory export, Sale creation),
 * since no FIFO/weighted-average costing exists. Extracted from what were
 * three separate copies of this same query (Dashboard, Inventory export, and
 * now Sale creation's cost snapshot) once a third, write-path caller made the
 * duplication a real correctness risk rather than a cosmetic one.
 */
@Service
@RequiredArgsConstructor
public class ProductCostService {

    private final StockInLineRepository stockInLineRepository;

    public Map<Long, BigDecimal> latestKnownCosts(Collection<Long> productIds) {
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
}
