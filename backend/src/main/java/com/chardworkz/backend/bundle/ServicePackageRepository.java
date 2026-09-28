package com.chardworkz.backend.bundle;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ServicePackageRepository extends JpaRepository<ServicePackage, Long> {
    List<ServicePackage> findByActiveTrue();
}
