package com.chardworkz.backend.account;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

/** Role/branch reassignment - {@link AccountController#update} restricts {@code role} to
 * EMPLOYEE/MANAGER and rejects editing or targeting an OWNER account entirely. */
public record UpdateAccountRequest(@NotNull Role role, @NotBlank String branchCode) {}
