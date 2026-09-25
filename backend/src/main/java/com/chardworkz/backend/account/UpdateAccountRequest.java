package com.chardworkz.backend.account;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

/** Full name + role/branch reassignment - {@link AccountController#update} restricts
 * {@code role} to EMPLOYEE/MANAGER and rejects editing or targeting an OWNER account
 * entirely. No {@code username} field on purpose - see security-qa-audit-2026-09-25.md's
 * username-immutability note: the field simply doesn't exist on this payload. */
public record UpdateAccountRequest(@NotBlank String fullName, @NotNull Role role, @NotBlank String branchCode) {}
