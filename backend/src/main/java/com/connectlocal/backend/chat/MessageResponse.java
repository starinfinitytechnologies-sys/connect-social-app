package com.connectlocal.backend.chat;

public record MessageResponse(
        String id,
        String senderId,
        String senderName,
        boolean mine,
        String type,
        String body,
        String attachmentUrl,
        String createdAt,
        String readAt
) {
}
