package com.chardworkz.backend.audit;

import com.chardworkz.backend.branch.Branch;
import com.chardworkz.backend.branch.BranchRepository;
import com.chardworkz.backend.security.JwtService;
import io.jsonwebtoken.Claims;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

/**
 * Read-only activity feed - Owner/Manager only, same date-range/branch-scope
 * pattern as ReportsController (defaults to the trailing 30 days; Manager is
 * always forced to their own branch, Owner may see everything). actionType
 * and actorId filters are applied in-memory over the date-bounded result,
 * matching this app's existing in-memory-filter precedent (DEC-033) rather
 * than a dynamic query builder, since expected volume is small.
 */
@RestController
@RequestMapping("/api/activity-log")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('OWNER', 'MANAGER')")
public class ActivityLogController {

    private final ActivityLogRepository activityLogRepository;
    private final BranchRepository branchRepository;
    private final JwtService jwtService;

    @GetMapping
    public List<ActivityLogResponse> list(
        @RequestParam(required = false) LocalDate from,
        @RequestParam(required = false) LocalDate to,
        @RequestParam(required = false) ActionType actionType,
        @RequestParam(required = false) Long actorId,
        Authentication authentication) {
        Claims claims = (Claims) authentication.getDetails();
        String role = jwtService.extractRole(claims);

        LocalDate resolvedTo = to != null ? to : LocalDate.now();
        LocalDate resolvedFrom = from != null ? from : resolvedTo.minusDays(29);
        ZoneId zone = ZoneId.systemDefault();
        Instant fromInstant = resolvedFrom.atStartOfDay(zone).toInstant();
        Instant toInstant = resolvedTo.plusDays(1).atStartOfDay(zone).toInstant();

        List<ActivityLog> logs = "MANAGER".equals(role)
            ? activityLogRepository.findByBranchIdAndOccurredAtBetweenOrderByOccurredAtDesc(
                resolveBranch(jwtService.extractBranchCode(claims)).getId(), fromInstant, toInstant)
            : activityLogRepository.findByOccurredAtBetweenOrderByOccurredAtDesc(fromInstant, toInstant);

        return logs.stream()
            .filter(log -> actionType == null || log.getActionType() == actionType)
            .filter(log -> actorId == null || log.getActor().getId().equals(actorId))
            .map(ActivityLogResponse::from)
            .toList();
    }

    private Branch resolveBranch(String code) {
        return branchRepository.findByCode(code)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unknown branch"));
    }
}
