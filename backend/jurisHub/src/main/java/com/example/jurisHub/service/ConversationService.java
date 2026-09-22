package com.example.jurisHub.service;

import com.example.jurisHub.dto.conversation.ConversationDto;
import com.example.jurisHub.dto.conversation.CreateConversationRequest;
import com.example.jurisHub.entity.Conversation;

import java.util.List;

public interface ConversationService {
    /**
     * Create a new conversation
     */
    ConversationDto createConversation(CreateConversationRequest request, Long userId);
    /**
     * Get all conversations for a user
     */
    List<ConversationDto> getUserConversations(Long userId);
    /**
     * Get conversations by type for a user
     */
    List<ConversationDto> getUserConversationsByType(Long userId, Conversation.ConversationType type);
    /**
     * Get a conversation by ID
     */
    ConversationDto getConversationById(Long conversationId, Long userId);

    /**
     * Update conversation title
     */
    ConversationDto updateConversationTitle(Long conversationId, Long userId, String title);

    /**
     * Delete conversation
     */
    void deleteConversation(Long conversationId, Long userId);
}
