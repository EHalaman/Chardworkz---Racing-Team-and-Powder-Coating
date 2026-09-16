package com.chardworkz.backend.branch;

import java.math.BigDecimal;

public record BranchResponse(Long id, String code, String name, BigDecimal monthlySalesGoal) {

    static BranchResponse from(Branch branch) {
        return new BranchResponse(branch.getId(), branch.getCode(), branch.getName(), branch.getMonthlySalesGoal());
    }
}
