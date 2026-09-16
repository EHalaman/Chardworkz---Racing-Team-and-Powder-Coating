package com.chardworkz.backend.supplier;

import java.time.Instant;
import java.util.Collection;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface StockInLineRepository extends JpaRepository<StockInLine, Long> {

    @Query(
        "SELECT l FROM StockInLine l WHERE l.stockIn.branch.id = :branchId "
            + "ORDER BY l.stockIn.receivedAt DESC")
    List<StockInLine> findRecentByBranchId(@Param("branchId") Long branchId);

    /**
     * Every receipt line ever recorded for these products, across all
     * branches - used to approximate a "current cost" per product (most
     * recent by receivedAt) for the Shift Summary's margin estimate. No
     * FIFO/weighted-average costing exists, so this is a deliberate
     * approximation, not a precise cost basis.
     */
    List<StockInLine> findByProduct_IdIn(Collection<Long> productIds);

    List<StockInLine> findTop50ByStockIn_BranchIdOrderByStockIn_ReceivedAtDesc(Long branchId);

    List<StockInLine> findTop50ByOrderByStockIn_ReceivedAtDesc();

    List<StockInLine> findByStockIn_ReceivedAtGreaterThanEqualAndStockIn_BranchId(Instant from, Long branchId);

    List<StockInLine> findByStockIn_ReceivedAtGreaterThanEqual(Instant from);
}
