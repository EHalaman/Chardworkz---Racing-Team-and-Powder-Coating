package com.chardworkz.backend.audit;

import java.time.Instant;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ActivityLogRepository extends JpaRepository<ActivityLog, Long> {

    /** Owner view: every branch. Actor/action-type filters applied in-memory in the service, matching this app's existing in-memory-filter precedent (DEC-033) at this data volume. */
    List<ActivityLog> findByOccurredAtBetweenOrderByOccurredAtDesc(Instant from, Instant to);

    /** Manager view: forced to their own branch, same pattern as every other branch-scoped endpoint. */
    List<ActivityLog> findByBranchIdAndOccurredAtBetweenOrderByOccurredAtDesc(
        Long branchId, Instant from, Instant to);
}
