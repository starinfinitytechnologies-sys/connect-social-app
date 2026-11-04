package com.connectlocal.backend.catalog;

import java.util.List;

public record CatalogueResponse(
        List<PlanResponse> plans,
        List<CreditPackResponse> creditPacks,
        boolean paymentsEnabled
) {
}
