package com.connectlocal.backend.catalog;

public record CreditPackResponse(
        String id,
        int credits,
        int price,
        String label,
        String description
) {
}
