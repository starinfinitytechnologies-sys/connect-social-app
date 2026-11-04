package com.connectlocal.backend.user;

import java.time.Instant;

public record UserAccount(
        String id,
        String email,
        String passwordHash,
        String role,
        String fullName,
        String displayName,
        String avatarUrl,
        String city,
        String state,
        String area,
        String phone,
        boolean phoneVerified,
        boolean enabled,
        Instant createdAt,
        Instant updatedAt
) {
}
