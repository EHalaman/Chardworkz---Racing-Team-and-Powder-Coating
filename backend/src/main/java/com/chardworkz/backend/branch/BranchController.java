package com.chardworkz.backend.branch;

import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

/**
 * Settings screen's business/branch config, Owner-only. Only `name` is
 * editable - `code` is the stable identifier used everywhere else (JWT
 * claims, branch-scoping query params), so it stays fixed post-seed.
 */
@RestController
@RequestMapping("/api/branches")
@RequiredArgsConstructor
@PreAuthorize("hasRole('OWNER')")
public class BranchController {

    private final BranchRepository branchRepository;

    @GetMapping
    public List<BranchResponse> list() {
        return branchRepository.findAll().stream().map(BranchResponse::from).toList();
    }

    @PatchMapping("/{id}")
    public BranchResponse updateName(@PathVariable Long id, @Valid @RequestBody UpdateBranchNameRequest request) {
        Branch branch = branchRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Branch not found"));
        branch.setName(request.name());
        return BranchResponse.from(branchRepository.save(branch));
    }
}
