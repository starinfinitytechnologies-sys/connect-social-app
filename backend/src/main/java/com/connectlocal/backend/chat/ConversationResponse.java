package com.connectlocal.backend.chat;

import com.connectlocal.backend.professional.ProfessionalSummaryResponse;

public record ConversationResponse(
        String id,
        String connectionId,
        String otherUserId,
        String otherName,
        String professionalId,
        ProfessionalSummaryResponse professional,
        String lastMessage,
        String lastMessageAt,
        int unreadCount
) {
}
