package com.chardworkz.backend.inventory;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface StockLevelRepository extends JpaRepository<StockLevel, Long> {

    // StockLevel.product is an EAGER @ManyToOne, so without this graph Hibernate loaded each
    // product with its own SELECT (~400 extra queries per dashboard call). Join-fetch it instead.
    @EntityGraph(attributePaths = "product")
    List<StockLevel> findByBranchId(Long branchId);

    /** Per-product stock summed across every branch, as [productId, total] rows (aggregated in SQL, no entity loading). */
    @Query("select s.product.id, sum(s.quantity) from StockLevel s group by s.product.id")
    List<Object[]> sumQuantityByProduct();

    Optional<StockLevel> findByProductIdAndBranchId(Long productId, Long branchId);

    /**
     * Decrements stock but never below zero (Q12 accepted-oversell-risk decision:
     * clamp at zero rather than go negative or reject the sync).
     */
    @Modifying
    @Query(
        value =
            "UPDATE stock_level SET quantity = GREATEST(quantity - :qty, 0), updated_at = now() "
                + "WHERE product_id = :productId AND branch_id = :branchId",
        nativeQuery = true)
    void clampDecrement(@Param("productId") Long productId, @Param("branchId") Long branchId, @Param("qty") int qty);
}
