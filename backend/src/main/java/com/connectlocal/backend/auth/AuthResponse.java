package com.connectlocal.backend.auth;

import com.connectlocal.backend.user.UserResponse;

public record AuthResponse(
        String accessToken,
        String refreshToken,
        String tokenType,
        long expiresIn,
        UserResponse user
) {
}
