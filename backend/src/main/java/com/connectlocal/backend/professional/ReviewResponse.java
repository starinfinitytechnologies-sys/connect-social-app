package com.connectlocal.backend.professional;

public record ReviewResponse(
        String id,
        String author,
        int rating,
        String text,
        String date,
        boolean verifiedInteraction
) {
}
