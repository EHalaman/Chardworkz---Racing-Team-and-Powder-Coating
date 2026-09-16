package com.chardworkz.backend.permission;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

/**
 * Callable directly from @PreAuthorize SpEL (e.g. {@code @permissionService.isEnabled('MANAGER_EDIT_PRODUCTS')})
 * so the configurable-permission check stays declarative, consistent with
 * every other role check in this codebase.
 */
@Service
@RequiredArgsConstructor
public class PermissionService {

    private final PermissionRepository permissionRepository;

    public boolean isEnabled(String permissionKey) {
        return permissionRepository.findById(permissionKey).map(PermissionFlag::isEnabled).orElse(false);
    }
}
