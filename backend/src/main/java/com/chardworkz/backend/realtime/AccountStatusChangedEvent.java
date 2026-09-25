package com.chardworkz.backend.realtime;

/**
 * Published by AccountController#updateStatus (activate/deactivate) and
 * #resetPassword - both already bump the account's token_version to reject
 * its next REST call (JwtAuthenticationFilter). An open SSE stream is a
 * single long-lived request that check never re-runs against, so this event
 * exists specifically to force-close that account's stream(s) too, the same
 * instant its other sessions are revoked - see
 * docs/realtime-sales-sync-spec-2026-09-25.md's Ticket 4 interaction note.
 */
public record AccountStatusChangedEvent(Long accountId) {}
