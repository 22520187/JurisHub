package com.example.jurisHub.controller;

import com.example.jurisHub.dto.messaging.CreateUserConversationRequest;
import com.example.jurisHub.dto.messaging.SendUserMessageRequest;
import com.example.jurisHub.dto.messaging.UserConversationDto;
import com.example.jurisHub.dto.messaging.UserMessageDto;
import com.example.jurisHub.security.UserPrincipal;
import com.example.jurisHub.service.UserMessagingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/user-conversations")
@RequiredArgsConstructor
public class UserMessagingController {
    private final UserMessagingService userMessagingService;

    @GetMapping
    public ResponseEntity<List<UserConversationDto>> getUserConversations(
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        List<UserConversationDto> conversation = userMessagingService.getUserConversations(userPrincipal.getId());
        return ResponseEntity.ok(conversation);
    }

    @PostMapping
    public ResponseEntity<UserConversationDto> createUserConversation(
            @Valid @RequestBody CreateUserConversationRequest request,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        UserConversationDto conversation = userMessagingService.createConversation(userPrincipal.getId(), request);
        return ResponseEntity.ok(conversation);
    }

    @PostMapping("/get-or-create")
    public ResponseEntity<UserConversationDto> getOrCreateConversation(
            @RequestParam Long otherUserId,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        UserConversationDto conversation = userMessagingService.getOrCreateConversation(
                userPrincipal.getId(), otherUserId);
        return ResponseEntity.ok(conversation);
    }

    @GetMapping("/{conversationId}")
    public ResponseEntity<UserConversationDto> getConversation(
            @PathVariable Long conversationId,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        UserConversationDto conversation = userMessagingService.getConversationById(
                conversationId, userPrincipal.getId());
        return ResponseEntity.ok(conversation);
    }

    @GetMapping("/{conversationId}/messages")
    public ResponseEntity<List<UserMessageDto>> getConversationMessages(
            @PathVariable Long conversationId,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        List<UserMessageDto> messages = userMessagingService.getConversationMessages(
                conversationId, userPrincipal.getId());
        return ResponseEntity.ok(messages);
    }

    @PostMapping("/messages")
    public ResponseEntity<UserMessageDto> sendMessage(
            @Valid @RequestBody SendUserMessageRequest request,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        UserMessageDto message = userMessagingService.sendMessage(userPrincipal.getId(), request);
        return ResponseEntity.ok(message);
    }

    @PutMapping("/{conversationId}/read")
    public ResponseEntity<Void> markMessagesAsRead(
            @PathVariable Long conversationId,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        userMessagingService.markMessagesAsRead(conversationId, userPrincipal.getId());
        return ResponseEntity.ok().build();
    }
}
