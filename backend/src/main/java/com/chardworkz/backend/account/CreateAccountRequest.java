package com.chardworkz.backend.account;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreateAccountRequest(
    @NotBlank String username,
    @NotBlank @Size(min = 8) String password,
    @NotBlank String fullName,
    @NotNull Role role,
    @NotBlank String branchCode) {}
