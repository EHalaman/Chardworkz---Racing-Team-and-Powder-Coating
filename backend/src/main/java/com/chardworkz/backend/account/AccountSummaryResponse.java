package com.chardworkz.backend.account;

public record AccountSummaryResponse(
    Long id, String username, String fullName, Role role, String branchCode, boolean active) {

    static AccountSummaryResponse from(Account account) {
        return new AccountSummaryResponse(
            account.getId(),
            account.getUsername(),
            account.getFullName(),
            account.getRole(),
            account.getBranch().getCode(),
            account.isActive());
    }
}
