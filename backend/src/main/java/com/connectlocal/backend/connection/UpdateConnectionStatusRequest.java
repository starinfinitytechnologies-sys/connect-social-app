package com.connectlocal.backend.connection;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record UpdateConnectionStatusRequest(
        @NotBlank
        @Pattern(regexp = "accepted|declined|cancelled", message = "Use accepted, declined or cancelled.")
        String status
) {
}
