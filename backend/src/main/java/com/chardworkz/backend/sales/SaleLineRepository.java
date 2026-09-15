package com.chardworkz.backend.sales;

import java.util.Collection;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface SaleLineRepository extends JpaRepository<SaleLine, Long> {

    @Query("SELECT l FROM SaleLine l JOIN FETCH l.product WHERE l.sale.id IN :saleIds")
    List<SaleLine> findBySaleIdIn(@Param("saleIds") Collection<UUID> saleIds);
}
