package com.connectlocal.backend.professional;

public record ProfessionalQuery(
        String categoryId,
        String subcategoryId,
        String query,
        String city,
        Double latitude,
        Double longitude,
        Double radiusKm,
        String sort,
        int page,
        int size
) {
    public int safePage() {
        return Math.max(page, 0);
    }

    public int safeSize() {
        return Math.min(Math.max(size, 1), 50);
    }
}
