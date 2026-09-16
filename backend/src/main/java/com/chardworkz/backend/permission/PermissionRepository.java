package com.chardworkz.backend.permission;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PermissionRepository extends JpaRepository<PermissionFlag, String> {
    List<PermissionFlag> findAllByOrderByPermissionKey();
}
