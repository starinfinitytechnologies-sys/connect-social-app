package com.connectlocal.backend.professional;

public record PortfolioResponse(
        String id,
        String title,
        String description,
        String imageUrl,
        String categoryLabel
) {
}
