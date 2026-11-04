package com.connectlocal.backend.catalog;

import java.util.List;

public record CategoryResponse(
        String id,
        String name,
        String description,
        String icon,
        String color,
        String softColor,
        boolean regulated,
        String disclaimer,
        List<SubcategoryResponse> subcategories
) {
}
