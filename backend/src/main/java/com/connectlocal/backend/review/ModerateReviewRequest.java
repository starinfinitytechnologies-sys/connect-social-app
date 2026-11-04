package com.connectlocal.backend.review;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record ModerateReviewRequest(
        @NotBlank
        @Pattern(regexp = "published|rejected", message = "Use published or rejected.")
        String status
) {
}
