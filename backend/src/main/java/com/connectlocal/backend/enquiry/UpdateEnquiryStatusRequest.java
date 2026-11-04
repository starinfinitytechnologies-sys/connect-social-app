package com.connectlocal.backend.enquiry;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record UpdateEnquiryStatusRequest(
        @NotBlank
        @Pattern(
                regexp = "recorded|delivered|responded|closed|cancelled",
                message = "Use a supported enquiry status."
        )
        String status
) {
}
