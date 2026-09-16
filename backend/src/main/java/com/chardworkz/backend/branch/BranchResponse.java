package com.chardworkz.backend.branch;

public record BranchResponse(Long id, String code, String name) {

    static BranchResponse from(Branch branch) {
        return new BranchResponse(branch.getId(), branch.getCode(), branch.getName());
    }
}
