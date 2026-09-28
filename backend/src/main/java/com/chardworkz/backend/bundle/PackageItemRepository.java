package com.chardworkz.backend.bundle;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PackageItemRepository extends JpaRepository<PackageItem, Long> {
    List<PackageItem> findByServicePackage_IdIn(List<Long> packageIds);
}
