package com.example.jurisHub.service.impl;

import com.example.jurisHub.dto.conversation.MessageDto;
import com.example.jurisHub.dto.conversation.SendMessageRequest;
import com.example.jurisHub.entity.Conversation;
import com.example.jurisHub.entity.Message;
import com.example.jurisHub.mapper.ConversationMapper;
import com.example.jurisHub.repository.ConversationRepository;
import com.example.jurisHub.repository.MessageRepository;
import com.example.jurisHub.service.MessageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class MessageServiceImpl implements MessageService {
    private final MessageRepository messageRepository;
    private final ConversationRepository conversationRepository;
    private final ConversationMapper conversationMapper;

    @Override
    public MessageDto sendMessage(SendMessageRequest request, Long userId) {
        log.info("Sending message for conversation: {} by user: {}, role: {}",
                request.getConversationId(), userId, request.getRole());

        Conversation conversation = conversationRepository.findById(request.getConversationId())
                .orElseThrow(() -> new RuntimeException("Conversation not found"));

        MessageDto message = saveMessage(request.getConversationId(), request.getContent(), request.getRole());
        conversation.setUpdatedAt(LocalDateTime.now());
        conversationRepository.save(conversation);

        return message;
    }

    @Override
    @Transactional(readOnly = true)
    public List<MessageDto> getConversationMessages(Long conversationId, Long userId) {
        log.info("Getting messages for conversation: {} by user: {}", conversationId, userId);
        conversationRepository.findByIdAndUserId(conversationId, userId)
                .orElseThrow(() -> new RuntimeException("Conversation not found or access denied"));

        List<Message> messages = messageRepository.findByConversationIdOrderByCreatedAtAsc(conversationId);
        return conversationMapper.toMessageDtoList(messages);
    }

    @Override
    public MessageDto saveMessage(Long conversationId, String content, Message.MessageRole role) {
        log.info("Saving message for conversation: {}, role: {}", conversationId, role);
        Message message = Message.builder()
                .conversationId(conversationId)
                .content(content)
                .role(role)
                .build();

        message = messageRepository.save(message);
        return conversationMapper.toMessageDto(message);
    }
}
