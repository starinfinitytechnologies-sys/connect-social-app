package com.connectlocal.backend.professional;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

public record ProfessionalProfileRequest(
        @NotBlank @Size(max = 50) String categoryId,
        @NotBlank @Size(max = 120) String profession,
        @Size(max = 160) String businessName,
        @Size(max = 160) String headline,
        @Size(max = 4000) String bio,
        @Min(0) @Max(80) Integer experienceYears,
        List<@Size(max = 30) String> languages,
        @DecimalMin("0.1") @DecimalMax("1000.0") BigDecimal serviceRadiusKm,
        @Pattern(
                regexp = "available_now|available_today|available_this_week|busy|away",
                message = "Use a supported availability status."
        ) String availabilityStatus,
        Map<String, String> workingHours,
        @Size(max = 80) String nextSlot,
        @Size(max = 120) String area,
        @Size(max = 100) String city,
        @Size(max = 100) String state,
        @DecimalMin("-90.0") @DecimalMax("90.0") BigDecimal latitude,
        @DecimalMin("-180.0") @DecimalMax("180.0") BigDecimal longitude,
        @Min(0) Integer pricingFrom,
        List<@Size(max = 60) String> subcategoryIds,
        @Valid List<ServiceInput> services,
        @Valid List<ContactInput> contacts
) {
}
