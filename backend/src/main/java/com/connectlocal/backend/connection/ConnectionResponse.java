package com.connectlocal.backend.connection;

import com.connectlocal.backend.professional.ProfessionalSummaryResponse;

public record ConnectionResponse(
        String id,
        String otherUserId,
        String otherName,
        String professionalId,
        ProfessionalSummaryResponse professional,
        String status,
        String direction,
        String message,
        String createdAt
) {
}
