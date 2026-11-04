package com.connectlocal.backend.chat;

import com.connectlocal.backend.security.UserPrincipal;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/conversations")
public class ChatController {

    private final ChatService chatService;

    public ChatController(ChatService chatService) {
        this.chatService = chatService;
    }

    @GetMapping
    public List<ConversationResponse> list(@AuthenticationPrincipal UserPrincipal principal) {
        return chatService.list(principal);
    }

    @GetMapping("/{conversationId}/messages")
    public List<MessageResponse> messages(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable String conversationId
    ) {
        return chatService.messages(principal, conversationId);
    }

    @PostMapping("/{conversationId}/messages")
    public MessageResponse send(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable String conversationId,
            @Valid @RequestBody SendMessageRequest request
    ) {
        return chatService.send(principal, conversationId, request.body());
    }
}
