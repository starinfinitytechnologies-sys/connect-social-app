package com.connectlocal.backend.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
        @NotBlank @Size(min = 2, max = 120) String fullName,
        @NotBlank @Email @Size(max = 255) String email,
        @NotBlank @Size(min = 8, max = 72) String password,
        @Size(max = 100) String city,
        @Size(max = 100) String state,
        @Size(max = 120) String area,
        @Size(max = 30) String phone
) {
}
