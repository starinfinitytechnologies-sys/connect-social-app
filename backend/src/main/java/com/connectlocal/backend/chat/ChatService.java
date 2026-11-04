package com.connectlocal.backend.chat;

import com.connectlocal.backend.common.ApiException;
import com.connectlocal.backend.professional.ProfessionalRepository;
import com.connectlocal.backend.security.UserPrincipal;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ChatService {

    private final ConversationRepository conversationRepository;
    private final ProfessionalRepository professionalRepository;

    public ChatService(
            ConversationRepository conversationRepository,
            ProfessionalRepository professionalRepository
    ) {
        this.conversationRepository = conversationRepository;
        this.professionalRepository = professionalRepository;
    }

    public List<ConversationResponse> list(UserPrincipal principal) {
        return conversationRepository.listForUser(principal.id()).stream()
                .map(row -> new ConversationResponse(
                        row.id(),
                        row.connectionId(),
                        row.otherUserId(),
                        row.otherName(),
                        row.professionalId(),
                        row.professionalId() == null
                                ? null
                                : professionalRepository.findSummaryById(row.professionalId()).orElse(null),
                        row.lastMessage(),
                        row.lastMessageAt(),
                        row.unreadCount()
                ))
                .toList();
    }

    @Transactional
    public List<MessageResponse> messages(UserPrincipal principal, String conversationId) {
        requireParticipant(principal, conversationId);
        return conversationRepository.messages(conversationId, principal.id()).stream()
                .map(row -> toResponse(row, principal.id()))
                .toList();
    }

    @Transactional
    public MessageResponse send(UserPrincipal principal, String conversationId, String body) {
        requireParticipant(principal, conversationId);
        String cleanBody = body == null ? "" : body.trim();
        if (cleanBody.isEmpty()) {
            throw ApiException.badRequest("Write a message before sending.");
        }
        return toResponse(
                conversationRepository.send(conversationId, principal.id(), cleanBody),
                principal.id()
        );
    }

    private void requireParticipant(UserPrincipal principal, String conversationId) {
        if (!conversationRepository.isParticipant(conversationId, principal.id())) {
            throw ApiException.forbidden("You are not part of this conversation.");
        }
    }

    private static MessageResponse toResponse(ConversationRepository.MessageRow row, String userId) {
        return new MessageResponse(
                row.id(),
                row.senderId(),
                row.senderName(),
                row.senderId().equals(userId),
                row.type(),
                row.body(),
                row.attachmentUrl(),
                row.createdAt(),
                row.readAt()
        );
    }
}
