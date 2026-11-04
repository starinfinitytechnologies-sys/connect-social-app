package com.connectlocal.backend.enquiry;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateEnquiryRequest(
        @NotBlank String professionalId,
        String serviceId,
        @NotBlank @Size(min = 10, max = 2000) String message
) {
}
