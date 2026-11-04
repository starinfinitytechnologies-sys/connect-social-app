package com.connectlocal.backend.professional;

public record EducationResponse(
        String id,
        String degree,
        String institute,
        Integer year,
        boolean verified
) {
}
