package com.example.jurisHub.repository;

import com.example.jurisHub.entity.Conversation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ConversationRepository extends JpaRepository<Conversation, Long> {
    /**
     * Find all conversations by user ID ordered by updated date descending
     */
    List<Conversation> findByUserIdOrderByUpdatedAtDesc(Long userId);

    /**
     * Find conversations by user ID and type
     */
    List<Conversation> findByUserIdAndTypeOrderByUpdatedAtDesc(Long userId, Conversation.ConversationType type);

    /**
     * Find conversation by ID and user ID (for security)
     */
    Optional<Conversation> findByIdAndUserId(Long id, Long userId);


    /**
     * Find conversation with messages and PDF document eagerly loaded
     */
    @Query("SELECT c FROM Conversation c LEFT JOIN FETCH c.messages LEFT JOIN FETCH c.pdfDocument WHERE c.id = :id AND c.userId = :userId")
    Optional<Conversation> findByIdAndUserIdWithDetails(@Param("id") Long id, @Param("userId") Long userId);

    @Query("SELECT c.type, COUNT(c) FROM Conversation c WHERE c.createdAt >= :startDate GROUP BY c.type")
    List<Object[]> countConversationsByType(@Param("startDate") java.time.LocalDateTime startDate);


}
