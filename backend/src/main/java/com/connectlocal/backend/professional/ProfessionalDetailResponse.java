package com.connectlocal.backend.professional;

import com.connectlocal.backend.catalog.SubcategoryResponse;

import java.util.List;
import java.util.Map;

public record ProfessionalDetailResponse(
        ProfessionalSummaryResponse profile,
        String bio,
        List<SubcategoryResponse> subcategories,
        List<ServiceResponse> services,
        List<EducationResponse> education,
        List<CertificationResponse> certifications,
        List<PortfolioResponse> portfolio,
        ContactResponse contact,
        Map<String, String> workingHours,
        List<ReviewResponse> reviews,
        String memberSince
) {
}
