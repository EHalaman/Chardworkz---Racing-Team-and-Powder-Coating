package com.chardworkz.backend.branch;

import java.math.BigDecimal;
import java.time.LocalTime;

public record BranchResponse(
    Long id, String code, String name, BigDecimal monthlySalesGoal, LocalTime openingTime, LocalTime closingTime) {

    static BranchResponse from(Branch branch) {
        return new BranchResponse(
            branch.getId(), branch.getCode(), branch.getName(), branch.getMonthlySalesGoal(),
            branch.getOpeningTime(), branch.getClosingTime());
    }
}
