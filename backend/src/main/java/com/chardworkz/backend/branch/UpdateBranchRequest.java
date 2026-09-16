package com.chardworkz.backend.branch;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public record UpdateBranchRequest(@NotBlank String name, @NotNull @DecimalMin("0") BigDecimal monthlySalesGoal) {}
