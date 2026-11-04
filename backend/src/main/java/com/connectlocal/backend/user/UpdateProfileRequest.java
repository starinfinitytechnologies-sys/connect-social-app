package com.connectlocal.backend.user;

import jakarta.validation.constraints.Size;

public record UpdateProfileRequest(
        @Size(max = 120) String fullName,
        @Size(max = 80) String displayName,
        @Size(max = 500) String avatarUrl,
        @Size(max = 100) String city,
        @Size(max = 100) String state,
        @Size(max = 120) String area,
        @Size(max = 30) String phone
) {
}
