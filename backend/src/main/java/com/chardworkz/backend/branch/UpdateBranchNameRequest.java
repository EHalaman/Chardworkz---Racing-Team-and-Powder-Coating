package com.chardworkz.backend.branch;

import jakarta.validation.constraints.NotBlank;

public record UpdateBranchNameRequest(@NotBlank String name) {}
