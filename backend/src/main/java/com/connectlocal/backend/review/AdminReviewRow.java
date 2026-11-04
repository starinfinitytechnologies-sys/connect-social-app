package com.connectlocal.backend.review;

public record AdminReviewRow(
        String id,
        String enquiryId,
        String professionalId,
        String customerName,
        int rating,
        String body,
        String status,
        String createdAt
) {
}
