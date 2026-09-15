package com.chardworkz.backend.supplier;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface StockInLineRepository extends JpaRepository<StockInLine, Long> {

    @Query(
        "SELECT l FROM StockInLine l WHERE l.stockIn.branch.id = :branchId "
            + "ORDER BY l.stockIn.receivedAt DESC")
    List<StockInLine> findRecentByBranchId(@Param("branchId") Long branchId);
}
