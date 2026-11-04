package com.connectlocal.backend.user;

import java.time.Instant;

public record UserResponse(
        String id,
        String email,
        String role,
        String fullName,
        String displayName,
        String avatarUrl,
        String city,
        String state,
        String area,
        String phone,
        boolean phoneVerified,
        Instant createdAt
) {
    public static UserResponse from(UserAccount account) {
        return new UserResponse(
                account.id(),
                account.email(),
                account.role(),
                account.fullName(),
                account.displayName(),
                account.avatarUrl(),
                account.city(),
                account.state(),
                account.area(),
                account.phone(),
                account.phoneVerified(),
                account.createdAt()
        );
    }
}
