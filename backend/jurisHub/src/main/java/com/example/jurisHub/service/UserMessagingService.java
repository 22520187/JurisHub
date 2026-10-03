package com.example.jurisHub.service;

import com.example.jurisHub.dto.messaging.CreateUserConversationRequest;
import com.example.jurisHub.dto.messaging.SendUserMessageRequest;
import com.example.jurisHub.dto.messaging.UserConversationDto;
import com.example.jurisHub.dto.messaging.UserMessageDto;

import java.util.List;

public interface UserMessagingService {

    /**
     * Get all conversations for a user
     */
    List<UserConversationDto> getUserConversations(Long userId);

    /**
     * Get messages for a specific conversation
     */
    List<UserMessageDto> getConversationMessages(Long conversationId, Long userId);

    /**
     * Create a new conversation between two users
     */
    UserConversationDto createConversation(Long userId, CreateUserConversationRequest request);

    /**
     * Get or create a conversation between two users
     */
    UserConversationDto getOrCreateConversation(Long user1Id, Long user2Id);

    /**
     * Send a message in a conversation
     */
    UserMessageDto sendMessage(Long userId, SendUserMessageRequest request);

    /**
     * Mark messages as read for a user in a conversation
     */
    void markMessagesAsRead(Long conversationId, Long userId);

    /**
     * Get conversation by ID (with security check)
     */
    UserConversationDto getConversationById(Long conversationId, Long userId);

}
