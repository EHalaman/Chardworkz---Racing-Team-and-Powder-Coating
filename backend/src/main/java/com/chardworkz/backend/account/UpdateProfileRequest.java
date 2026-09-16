package com.chardworkz.backend.account;

import jakarta.validation.constraints.NotBlank;

public record UpdateProfileRequest(@NotBlank String fullName) {}
