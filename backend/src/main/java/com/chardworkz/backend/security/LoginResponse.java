package com.chardworkz.backend.security;

public record LoginResponse(String token, String username, String fullName, String role, String branchCode) {}
