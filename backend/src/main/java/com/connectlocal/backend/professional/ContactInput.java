package com.connectlocal.backend.professional;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ContactInput(
        @NotBlank @Size(max = 20) String channel,
        @NotBlank @Size(max = 255) String value,
        Boolean isPublic
) {
}
