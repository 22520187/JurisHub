package com.example.jurisHub.repository;

import com.example.jurisHub.entity.UserConversation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserConversationRepository extends JpaRepository<UserConversation, Long> {

    @Query("SELECT uc FROM UserConversation uc " +
            "WHERE (uc.user1.id = :userId OR uc.user2.id = :userId) " +
            "AND uc.isActive = true " +
            "ORDER BY uc.lastMessageAt DESC NULLS LAST, uc.createdAt DESC")
    List<UserConversation> findByUserIdOrderByLastMessageAtDesc(@Param("userId") Long userId);

    @Query("SELECT uc FROM UserConversation uc " +
            "WHERE ((uc.user1.id = :user1Id AND uc.user2.id = :user2Id) " +
            "OR (uc.user1.id = :user2Id AND uc.user2.id = :user1Id)) " +
            "AND uc.isActive = true")
    Optional<UserConversation> findByUsers(@Param("user1Id") Long user1Id, @Param("user2Id") Long user2Id);

    @Query("SELECT uc FROM UserConversation uc " +
            "WHERE uc.id = :conversationId " +
            "AND (uc.user1.id = :userId OR uc.user2.id = :userId) " +
            "AND uc.isActive = true")
    Optional<UserConversation> findByIdAndUserId(@Param("conversationId") Long conversationId, @Param("userId") Long userId);

}
