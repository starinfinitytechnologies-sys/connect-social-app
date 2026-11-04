package com.connectlocal.backend.professional;

public record ServiceResponse(
        String id,
        String name,
        String description,
        int price,
        String priceType,
        String duration
) {
}
