package com.chardworkz.backend.audit;

import java.time.Instant;

public record ActivityLogResponse(
    Long id,
    Long actorId,
    String actorName,
    ActionType actionType,
    String entityType,
    String entityId,
    String branchCode,
    String summary,
    Instant occurredAt) {

    static ActivityLogResponse from(ActivityLog log) {
        return new ActivityLogResponse(
            log.getId(),
            log.getActor().getId(),
            log.getActorName(),
            log.getActionType(),
            log.getEntityType(),
            log.getEntityId(),
            log.getBranch() != null ? log.getBranch().getCode() : null,
            log.getSummary(),
            log.getOccurredAt());
    }
}
