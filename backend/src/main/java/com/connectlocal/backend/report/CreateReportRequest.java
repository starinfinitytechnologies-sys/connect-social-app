package com.connectlocal.backend.report;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record CreateReportRequest(
        @NotBlank
        @Pattern(regexp = "profile|enquiry|message|review", message = "Unsupported report target.")
        String targetType,
        @NotBlank String targetId,
        @NotBlank @Size(min = 3, max = 120) String reason,
        @Size(max = 2000) String details
) {
}
