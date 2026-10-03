package com.example.jurisHub.repository;

import com.example.jurisHub.entity.UserMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UserMessageRepository extends JpaRepository<UserMessage,Long> {

    @Query("SELECT um FROM UserMessage um " +
            "WHERE um.conversation.id = :conversationId " +
            "AND um.isActive = true " +
            "ORDER BY um.createdAt ASC")
    List<UserMessage> findByConversationIdOrderByCreatedAtAsc(@Param("conversationId") Long conversationId);

    @Query("SELECT um FROM UserMessage um " +
            "WHERE um.conversation.id = :conversationId " +
            "AND um.sender.id != :userId " +
            "AND um.isRead = false " +
            "AND um.isActive = true")
    List<UserMessage> findUnreadMessages(@Param("conversationId") Long conversationId, @Param("userId") Long userId);

    @Query("SELECT COUNT(um) FROM UserMessage um " +
            "WHERE um.conversation.id = :conversationId " +
            "AND um.sender.id != :userId " +
            "AND um.isRead = false " +
            "AND um.isActive = true")
    long countUnreadMessages(@Param("conversationId") Long conversationId, @Param("userId") Long userId);

    @Modifying
    @Query("UPDATE UserMessage um SET um.isRead = true " +
            "WHERE um.conversation.id = :conversationId " +
            "AND um.sender.id != :userId " +
            "AND um.isRead = false " +
            "AND um.isActive = true")
    int markMessagesAsRead(@Param("conversationId") Long conversationId, @Param("userId") Long userId);

    @Query("SELECT um FROM UserMessage um " +
            "WHERE um.conversation.id = :conversationId " +
            "AND um.isActive = true " +
            "ORDER BY um.createdAt DESC")
    List<UserMessage> findByConversationIdOrderByCreatedAtDesc(@Param("conversationId") Long conversationId);



}
