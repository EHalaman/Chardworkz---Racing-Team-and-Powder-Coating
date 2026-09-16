package com.chardworkz.backend.permission;

public record PermissionResponse(String permissionKey, boolean enabled) {
    static PermissionResponse from(PermissionFlag flag) {
        return new PermissionResponse(flag.getPermissionKey(), flag.isEnabled());
    }
}
