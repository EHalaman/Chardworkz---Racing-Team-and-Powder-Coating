package com.chardworkz.backend.branch;

import com.chardworkz.backend.audit.ActionType;
import com.chardworkz.backend.audit.ActivityLogService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

/**
 * Settings screen's business/branch config, Owner-only. `name` and
 * `monthlySalesGoal` are editable - `code` is the stable identifier used
 * everywhere else (JWT claims, branch-scoping query params), so it stays
 * fixed post-seed.
 */
@RestController
@RequestMapping("/api/branches")
@RequiredArgsConstructor
@PreAuthorize("hasRole('OWNER')")
public class BranchController {

    private final BranchRepository branchRepository;
    private final ActivityLogService activityLogService;

    @GetMapping
    public List<BranchResponse> list() {
        return branchRepository.findAll().stream().map(BranchResponse::from).toList();
    }

    @PatchMapping("/{id}")
    public BranchResponse update(
        @PathVariable Long id, @Valid @RequestBody UpdateBranchRequest request, Authentication authentication) {
        if (!request.openingTime().isBefore(request.closingTime())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Opening time must be before closing time");
        }

        Branch branch = branchRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Branch not found"));
        branch.setName(request.name());
        branch.setMonthlySalesGoal(request.monthlySalesGoal());
        branch.setOpeningTime(request.openingTime());
        branch.setClosingTime(request.closingTime());
        branch = branchRepository.save(branch);

        activityLogService.record(authentication, ActionType.UPDATE, "BRANCH", String.valueOf(branch.getId()),
            branch.getId(), "Updated branch \"" + branch.getName() + "\" settings");

        return BranchResponse.from(branch);
    }
}
