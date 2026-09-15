package com.chardworkz.backend.audit;

import com.chardworkz.backend.account.Account;
import jakarta.persistence.*;
import java.time.Instant;
import lombok.*;

/** Unconditional from Phase 0 as of 2026-09-15 (Q7 resolved: yes). */
@Entity
@Table(name = "audit_event")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuditEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "actor_id", nullable = false)
    private Account actor;

    @Column(name = "entity_name", nullable = false, length = 50)
    private String entityName;

    /** Text, not a FK: one audit log spans entities with different PK types (bigint vs. Sale's UUID). */
    @Column(name = "entity_id", nullable = false, length = 50)
    private String entityId;

    @Column(name = "field_name", nullable = false, length = 100)
    private String fieldName;

    @Column(name = "old_value", columnDefinition = "text")
    private String oldValue;

    @Column(name = "new_value", columnDefinition = "text")
    private String newValue;

    @Column(name = "changed_at", nullable = false)
    private Instant changedAt;
}
