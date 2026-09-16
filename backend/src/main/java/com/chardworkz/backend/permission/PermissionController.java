package com.chardworkz.backend.permission;

import jakarta.validation.Valid;
import java.time.Instant;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

/**
 * Settings-screen toggle for the two configurable Manager permission flags
 * (Product edit/delete) - Owner-only, same pattern as BranchController.
 */
@RestController
@RequestMapping("/api/permissions")
@RequiredArgsConstructor
@PreAuthorize("hasRole('OWNER')")
public class PermissionController {

    private final PermissionRepository permissionRepository;

    /** Read access is Owner+Manager (a Manager needs to know their own current permissions to decide what UI to show), overriding the class-level Owner-only default - only the PATCH below stays Owner-only. */
    @PreAuthorize("hasAnyRole('OWNER', 'MANAGER')")
    @GetMapping
    public List<PermissionResponse> list() {
        return permissionRepository.findAllByOrderByPermissionKey().stream()
            .map(PermissionResponse::from)
            .toList();
    }

    @PatchMapping("/{key}")
    public PermissionResponse update(@PathVariable String key, @Valid @RequestBody UpdatePermissionRequest request) {
        PermissionFlag flag = permissionRepository.findById(key)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Unknown permission key"));
        flag.setEnabled(request.enabled());
        flag.setUpdatedAt(Instant.now());
        return PermissionResponse.from(permissionRepository.save(flag));
    }
}
