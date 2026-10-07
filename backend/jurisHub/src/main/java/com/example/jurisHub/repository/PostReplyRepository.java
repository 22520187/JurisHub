package com.example.jurisHub.repository;

import com.example.jurisHub.entity.Post;
import com.example.jurisHub.entity.PostReply;
import com.example.jurisHub.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PostReplyRepository extends JpaRepository<PostReply, Long> {

    List<PostReply> findByPostAndParentIsNullOrderByCreatedAtAsc(Post post);

    long countByAuthorAndIsActiveTrue(User author);

    /**
     * Count all replies for posts in a specific category
     */
    @Query("SELECT COUNT(r) FROM PostReply r WHERE r.post.category.id = :categoryId AND r.isActive = true")
    long countByCategoryId(@Param("categoryId") Long categoryId);

    long countByIsActiveTrue();

    long countByIsActiveTrueAndCreatedAtAfter(java.time.LocalDateTime since);

    /**
     * Analytics: Count replies created after a date
     */
    long countByCreatedAtAfterAndIsActiveTrue(java.time.LocalDateTime startDate);

    /**
     * Analytics: Get average reply count per post
     */
    @Query("SELECT AVG(r.replyCount) FROM Post r WHERE r.createdAt >= :startDate AND r.isActive = true")
    Double getAverageReplyCountPerPost(@Param("startDate") java.time.LocalDateTime startDate);

    /**
     * Analytics: Count replies by date
     */
    @Query("SELECT DATE(r.createdAt) as date, COUNT(r) as count " +
            "FROM PostReply r " +
            "WHERE r.createdAt >= :startDate AND r.isActive = true " +
            "GROUP BY DATE(r.createdAt) " +
            "ORDER BY date")
    java.util.List<Object[]> countRepliesGroupedByDate(@Param("startDate") java.time.LocalDateTime startDate);

    /**
     * Analytics: Count replies by hour of day
     */
    @Query("SELECT HOUR(r.createdAt) as hour, COUNT(r) as count " +
            "FROM PostReply r " +
            "WHERE r.createdAt >= :startDate AND r.isActive = true " +
            "GROUP BY HOUR(r.createdAt) " +
            "ORDER BY hour")
    java.util.List<Object[]> countRepliesGroupedByHour(@Param("startDate") java.time.LocalDateTime startDate);

    @Query("SELECT COUNT(r) FROM PostReply r WHERE r.sentimentLabel = :label AND r.createdAt >= :since AND r.isActive = true")
    long countBySentimentLabelAndCreatedAtAfter(@Param("label") String label, @Param("since") java.time.LocalDateTime since);

    @Query("SELECT DATE(r.createdAt) as date, r.sentimentLabel as label, COUNT(r) as count " +
            "FROM PostReply r " +
            "WHERE r.createdAt >= :since AND r.isActive = true AND r.sentimentLabel IS NOT NULL " +
            "GROUP BY DATE(r.createdAt), r.sentimentLabel " +
            "ORDER BY date")
    java.util.List<Object[]> countReplySentimentGroupedByDate(@Param("since") java.time.LocalDateTime since);

    @Query("SELECT r FROM PostReply r WHERE r.sentimentLabel = 'positive' AND r.isActive = true AND r.createdAt >= :since ORDER BY r.sentimentScore DESC")
    java.util.List<PostReply> findTopPositiveReplies(@Param("since") java.time.LocalDateTime since, org.springframework.data.domain.Pageable pageable);

    @Query("SELECT r FROM PostReply r WHERE r.sentimentLabel = 'negative' AND r.isActive = true AND r.createdAt >= :since ORDER BY r.sentimentScore DESC")
    java.util.List<PostReply> findTopNegativeReplies(@Param("since") java.time.LocalDateTime since, org.springframework.data.domain.Pageable pageable);


}
