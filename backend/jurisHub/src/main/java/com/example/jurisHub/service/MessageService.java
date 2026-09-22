package com.example.jurisHub.service;

import com.example.jurisHub.dto.conversation.MessageDto;
import com.example.jurisHub.dto.conversation.SendMessageRequest;
import com.example.jurisHub.entity.Message;

import java.util.List;

public interface MessageService {
    /**
     * Send a user message and get AI response
     */
    MessageDto sendMessage(SendMessageRequest request, Long userId);

    /**
     * Get all messages for a conversation
     */
    List<MessageDto> getConversationMessages(Long conversationId, Long userId);

    /**
     * Save a message
     */
    MessageDto saveMessage(Long conversationId, String content, Message.MessageRole role);

}
