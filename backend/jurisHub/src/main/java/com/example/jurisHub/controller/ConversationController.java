package com.example.jurisHub.controller;

import com.example.jurisHub.dto.conversation.ConversationDto;
import com.example.jurisHub.dto.conversation.CreateConversationRequest;
import com.example.jurisHub.dto.conversation.MessageDto;
import com.example.jurisHub.entity.Conversation;
import com.example.jurisHub.security.UserPrincipal;
import com.example.jurisHub.service.ConversationService;
import com.example.jurisHub.service.MessageService;
import com.example.jurisHub.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/conversations")
@RequiredArgsConstructor
public class ConversationController {
    private final ConversationService conversationService;
    private final MessageService messageService;

    @PostMapping("/create")
    public ResponseEntity<ConversationDto> createConversation(@Valid @RequestBody CreateConversationRequest request,
                                                              @AuthenticationPrincipal UserPrincipal userPrincipal) {

        ConversationDto conversation = conversationService.createConversation(request, userPrincipal.getId());
        return ResponseEntity.ok(conversation);
    }

    @GetMapping
    public ResponseEntity<List<ConversationDto>> getUserConversations(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @RequestParam(required = false) Conversation.ConversationType type) {

        List<ConversationDto> conversations;
        if (type != null) {
            conversations = conversationService.getUserConversationsByType(userPrincipal.getId(), type);
        } else {
            conversations = conversationService.getUserConversations(userPrincipal.getId());
        }
        return ResponseEntity.ok(conversations);
    }

    @GetMapping("/{conversationId}")
    public ResponseEntity<ConversationDto> getConversation(
            @PathVariable Long conversationId,
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @RequestParam(defaultValue = "false") boolean includeDetails) {

        ConversationDto conversation;
        if (includeDetails) {
            conversation = conversationService.getConversationWithDetails(conversationId, userPrincipal.getId());
        } else {
            conversation = conversationService.getConversationById(conversationId, userPrincipal.getId());
        }
        return ResponseEntity.ok(conversation);
    }

    @PutMapping("/{conversationId}/title")
    public ResponseEntity<ConversationDto> updateConversationTitle(
            @PathVariable Long conversationId,
            @RequestBody UpdateTitleRequest request,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        ConversationDto conversation = conversationService.updateConversationTitle(
                conversationId, userPrincipal.getId(), request.getTitle());
        return ResponseEntity.ok(conversation);
    }

    @DeleteMapping("/{conversationId}")
    public ResponseEntity<Void> deleteConversation(
            @PathVariable Long conversationId,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        conversationService.deleteConversation(conversationId, userPrincipal.getId());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{conversationId}/messages")
    public ResponseEntity<List<MessageDto>> getConversationMessages(
            @PathVariable Long conversationId,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        List<MessageDto> messages = messageService.getConversationMessages(conversationId, userPrincipal.getId());
        return ResponseEntity.ok(messages);
    }

    public static class UpdateTitleRequest {
        private String title;

        public String getTitle() { return title; }
        public void setTitle(String title) { this.title = title; }
    }
}
