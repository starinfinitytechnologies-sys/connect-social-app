package com.connectlocal.backend.connection;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateConnectionRequest(
        @NotBlank String professionalId,
        @Size(max = 500) String message
) {
}
