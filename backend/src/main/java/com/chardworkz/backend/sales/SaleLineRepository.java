package com.chardworkz.backend.sales;

import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface SaleLineRepository extends JpaRepository<SaleLine, Long> {

    @Query("SELECT l FROM SaleLine l JOIN FETCH l.product WHERE l.sale.id IN :saleIds")
    List<SaleLine> findBySaleIdIn(@Param("saleIds") Collection<UUID> saleIds);

    /** Products with at least one sale at this branch since {@code since} - used to identify Dead Stock (the complement of this set). */
    @Query("SELECT DISTINCT l.product.id FROM SaleLine l WHERE l.sale.branch.id = :branchId AND l.sale.soldAt >= :since")
    Set<Long> findDistinctProductIdsSoldSince(@Param("branchId") Long branchId, @Param("since") Instant since);
}
