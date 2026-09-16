package com.chardworkz.backend.audit;

import com.chardworkz.backend.account.Account;
import com.chardworkz.backend.branch.Branch;
import jakarta.persistence.*;
import java.time.Instant;
import lombok.*;

/**
 * Purpose-built action-level activity feed (new 2026-09-16), distinct from
 * the existing field-level {@link AuditEvent} which nothing has ever
 * written to. Written explicitly from each controller mutation via
 * {@link ActivityLogService}, not a generic entity listener - this app
 * favors direct, explicit calls over framework-magic side effects.
 */
@Entity
@Table(name = "activity_log")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ActivityLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "actor_id", nullable = false)
    private Account actor;

    @Column(name = "actor_name", nullable = false, length = 150)
    private String actorName;

    @Enumerated(EnumType.STRING)
    @Column(name = "action_type", nullable = false, length = 20)
    private ActionType actionType;

    @Column(name = "entity_type", nullable = false, length = 50)
    private String entityType;

    @Column(name = "entity_id", length = 50)
    private String entityId;

    /** Contextual branch for filtering, not necessarily the entity's own branch (e.g. Owner acting on a different branch's inventory). */
    @ManyToOne
    @JoinColumn(name = "branch_id")
    private Branch branch;

    @Column(nullable = false, columnDefinition = "text")
    private String summary;

    @Column(name = "occurred_at", nullable = false)
    private Instant occurredAt;
}
