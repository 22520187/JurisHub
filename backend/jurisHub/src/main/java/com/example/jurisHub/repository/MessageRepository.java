package com.example.jurisHub.repository;

import com.example.jurisHub.entity.Message;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MessageRepository extends JpaRepository<Message, Long> {
    /**
     * Find all messages by conversation ID ordered by created date
     */
    List<Message> findByConversationIdOrderByCreatedAtAsc(Long conversationId);
}
