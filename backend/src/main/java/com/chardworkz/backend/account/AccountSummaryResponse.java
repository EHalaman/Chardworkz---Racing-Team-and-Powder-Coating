package com.chardworkz.backend.account;

import java.time.Instant;

public record AccountSummaryResponse(
    Long id,
    String username,
    String fullName,
    Role role,
    String branchCode,
    boolean active,
    Instant createdAt) {

    static AccountSummaryResponse from(Account account) {
        return new AccountSummaryResponse(
            account.getId(),
            account.getUsername(),
            account.getFullName(),
            account.getRole(),
            account.getBranch().getCode(),
            account.isActive(),
            account.getCreatedAt());
    }
}
