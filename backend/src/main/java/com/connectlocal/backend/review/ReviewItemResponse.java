package com.connectlocal.backend.review;

public record ReviewItemResponse(
        String id,
        String author,
        int rating,
        String text,
        String date,
        boolean verifiedInteraction,
        String status
) {
}
