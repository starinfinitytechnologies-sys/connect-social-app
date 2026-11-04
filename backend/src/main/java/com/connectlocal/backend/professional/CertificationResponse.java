package com.connectlocal.backend.professional;

public record CertificationResponse(
        String id,
        String title,
        String issuer,
        Integer year,
        boolean verified
) {
}
