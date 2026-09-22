package com.example.jurisHub.service.impl;

import com.example.jurisHub.mapper.ConversationMapper;
import com.example.jurisHub.repository.ConversationRepository;
import com.example.jurisHub.service.ConversationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class ConversationServiceImpl implements ConversationService {
    private final ConversationRepository conversationRepository;
    private final ConversationMapper conversationMapper;
    private final MessageService messageService;
}
