package com.chardworkz.backend.catalog;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProductRepository extends JpaRepository<Product, Long> {
    List<Product> findByActiveTrue();

    long countByActiveTrue();

    /** Excludes SERVICES-category products - they carry no stock_level concept at all. */
    List<Product> findByActiveTrueAndCategoryNot(Category category);

    /** Inventory Excel import's Product Name fallback match (no unique constraint on name, so this can legitimately return 2+ matches). */
    List<Product> findByActiveTrueAndNameIgnoreCase(String name);
}
