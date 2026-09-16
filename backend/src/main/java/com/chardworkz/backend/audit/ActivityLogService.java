package com.chardworkz.backend.audit;

import com.chardworkz.backend.account.Account;
import com.chardworkz.backend.account.AccountRepository;
import com.chardworkz.backend.branch.BranchRepository;
import com.chardworkz.backend.security.JwtService;
import io.jsonwebtoken.Claims;
import java.time.Instant;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

@Service
@RequiredArgsConstructor
public class ActivityLogService {

    private final ActivityLogRepository activityLogRepository;
    private final AccountRepository accountRepository;
    private final BranchRepository branchRepository;
    private final JwtService jwtService;

    /**
     * @param branchId contextual branch for filtering (e.g. Owner acting on a
     *     specific branch's inventory) - may be null for a truly global entity.
     */
    public void record(
        Authentication authentication,
        ActionType actionType,
        String entityType,
        String entityId,
        Long branchId,
        String summary) {
        Claims claims = (Claims) authentication.getDetails();
        Account actor = accountRepository.findById(jwtService.extractAccountId(claims))
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Account not found"));

        activityLogRepository.save(ActivityLog.builder()
            .actor(actor)
            .actorName(actor.getFullName())
            .actionType(actionType)
            .entityType(entityType)
            .entityId(entityId)
            .branch(branchId != null ? branchRepository.getReferenceById(branchId) : actor.getBranch())
            .summary(summary)
            .occurredAt(Instant.now())
            .build());
    }
}
