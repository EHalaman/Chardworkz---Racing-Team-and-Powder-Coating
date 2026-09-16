package com.chardworkz.backend.permission;

import jakarta.persistence.*;
import java.time.Instant;
import lombok.*;

/**
 * A flat key/value flag, not a generic per-role policy engine - only two
 * keys exist today (Manager access to Product edit/delete), matching this
 * codebase's preference for the simplest thing that satisfies the actual ask.
 */
@Entity
@Table(name = "permission_flag")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PermissionFlag {

    @Id
    @Column(name = "permission_key", length = 50)
    private String permissionKey;

    @Column(nullable = false)
    private boolean enabled;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
