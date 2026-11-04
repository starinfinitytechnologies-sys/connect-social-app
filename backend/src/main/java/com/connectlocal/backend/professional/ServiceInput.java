package com.connectlocal.backend.professional;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ServiceInput(
        @NotBlank @Size(max = 160) String name,
        @Size(max = 2000) String description,
        @Min(0) Integer price,
        @Size(max = 20) String priceType,
        @Size(max = 50) String duration
) {
}
