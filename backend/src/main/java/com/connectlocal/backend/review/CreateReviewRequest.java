package com.connectlocal.backend.review;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateReviewRequest(
        @NotBlank String enquiryId,
        @Min(1) @Max(5) int rating,
        @Size(max = 2000) String body
) {
}
