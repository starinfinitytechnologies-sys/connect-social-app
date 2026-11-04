package com.connectlocal.backend.catalog;

import java.util.List;
import java.util.Map;

public record PlanResponse(
        String id,
        String name,
        String tagline,
        int monthlyPrice,
        int annualPrice,
        Map<String, Object> limits,
        List<String> features,
        boolean highlight
) {
}
