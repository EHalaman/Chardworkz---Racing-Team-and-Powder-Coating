package com.chardworkz.backend.sales;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SaleRepository extends JpaRepository<Sale, UUID> {

    List<Sale> findBySoldAtBetweenAndBranchIdOrderBySoldAtDesc(Instant from, Instant to, Long branchId);

    List<Sale> findBySoldAtBetweenOrderBySoldAtDesc(Instant from, Instant to);

    List<Sale> findTop50ByBranchIdOrderBySoldAtDesc(Long branchId);

    List<Sale> findTop50ByOrderBySoldAtDesc();
}
