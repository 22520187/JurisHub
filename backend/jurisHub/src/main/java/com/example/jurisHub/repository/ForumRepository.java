package com.example.jurisHub.repository;

import com.example.jurisHub.entity.Post;
import com.example.jurisHub.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface ForumRepository extends JpaRepository<Post, Long> {
    /**
     * Count posts by author
     */
    long countByAuthorAndIsActiveTrue(User author);

    /**
     * Find posts by author with pagination
     */
    Page<Post> findByAuthorAndIsActiveTrueOrderByCreatedAtDesc(User author, Pageable pageable);

    /**
     * Find latest post for each category with author
     * Uses DISTINCT ON to get only one post per category (the most recent one)
     * Join with author to avoid N+1 lazy loading
     */
    @Query(value = "SELECT DISTINCT ON (p.category_id) p.id, p.title, p.slug, p.content, p.category_id, " +
            "p.author_id, p.views, p.reply_count, p.upvote_count, p.downvote_count, " +
            "p.is_pinned, p.is_solved, p.is_hot, p.is_active, p.report_count, p.is_reported, " +
            "p.violation_reason, p.tags, p.created_at, p.updated_at, p.last_reply_at " +
            "FROM posts p " +
            "WHERE p.is_active = true " +
            "ORDER BY p.category_id, p.created_at DESC",
            nativeQuery = true)
    List<Post> findLatestPostByCategory();

    /**
     * Count posts by category ID
     */
    long countByCategoryIdAndIsActiveTrue(Long categoryId);

    /**
     * Find posts with eager loading of category and author (without labels to allow proper pagination)
     */
    @Query(value = "SELECT DISTINCT p FROM Post p " +
            "LEFT JOIN FETCH p.category " +
            "LEFT JOIN FETCH p.author " +
            "WHERE p.isActive = true",
            countQuery = "SELECT COUNT(DISTINCT p) FROM Post p WHERE p.isActive = true")
    Page<Post> findAllWithCategoryAndAuthor(Pageable pageable);

    /**
     * Find posts by category ID with eager loading of category and author (without labels to allow proper pagination)
     */
    @Query(value = "SELECT DISTINCT p FROM Post p " +
            "LEFT JOIN FETCH p.category " +
            "LEFT JOIN FETCH p.author " +
            "WHERE p.category.id = :categoryId AND p.isActive = true",
            countQuery = "SELECT COUNT(DISTINCT p) FROM Post p WHERE p.category.id = :categoryId AND p.isActive = true")
    Page<Post> findByCategoryIdAndIsActiveTrue(@Param("categoryId") Long categoryId, Pageable pageable);

    /**
     * Find posts created after a certain date with eager loading of category and author (without labels to allow proper pagination)
     */
    @Query(value = "SELECT DISTINCT p FROM Post p " +
            "LEFT JOIN FETCH p.category " +
            "LEFT JOIN FETCH p.author " +
            "WHERE p.isActive = true AND p.createdAt >= :startDate",
            countQuery = "SELECT COUNT(DISTINCT p) FROM Post p WHERE p.isActive = true AND p.createdAt >= :startDate")
    Page<Post> findByIsActiveTrueAndCreatedAtAfter(@Param("startDate") LocalDateTime startDate, Pageable pageable);

    /**
     * Find posts by category slug with eager loading
     */
    @Query("SELECT p FROM Post p JOIN FETCH p.category c JOIN FETCH p.author WHERE c.slug = :categorySlug AND p.isActive = true ORDER BY p.createdAt DESC")
    Page<Post> findByCategorySlugAndIsActiveTrue(@Param("categorySlug") String categorySlug, Pageable pageable);

    /**
     * Search posts by title containing keyword
     */
    Page<Post> findByIsActiveTrueAndTitleContainingIgnoreCaseOrderByCreatedAtDesc(String title, Pageable pageable);

    /**
     * Search posts by content using native query (to avoid CLOB/STRING issues)
     */
    @Query(value = "SELECT p.id, p.title, p.content, p.category_id, p.author_id, p.views, p.reply_count, p.upvote_count, p.downvote_count, p.is_pinned, p.is_solved, p.is_hot, p.is_active, p.report_count, p.is_reported, p.violation_reason, p.tags, p.created_at, p.updated_at, p.last_reply_at FROM posts p WHERE p.is_active = true AND p.content LIKE ?1",
            nativeQuery = true,
            countQuery = "SELECT COUNT(*) FROM posts p WHERE p.is_active = true AND p.content LIKE ?1")
    Page<Post> findByIsActiveTrueAndContentContaining(String content, Pageable pageable);

    /**
     * Find post by ID with category, author and labels
     */
    @Query("SELECT DISTINCT p FROM Post p " +
            "LEFT JOIN FETCH p.category " +
            "LEFT JOIN FETCH p.author " +
            "LEFT JOIN FETCH p.labels " +
            "WHERE p.id = :id")
    Optional<Post> findByIdWithCategoryAndAuthorIncludingInactive(@Param("id") Long id);

    /**
     * Find post by slug (for SEO-friendly URLs)
     */
    @Query("SELECT p FROM Post p " +
            "LEFT JOIN FETCH p.category c " +
            "LEFT JOIN FETCH p.author " +
            "LEFT JOIN FETCH p.labels " +
            "WHERE c.slug = :categorySlug AND p.slug = :postSlug AND p.isActive = true")
    Optional<Post> findByCategorySlugAndPostSlug(@Param("categorySlug") String categorySlug, @Param("postSlug") String postSlug);

    /**
     * Update reply count
     */
    @Modifying
    @Query("UPDATE Post p SET p.replyCount = (SELECT COUNT(r) FROM PostReply r WHERE r.post.id = p.id AND r.isActive = true) WHERE p.id = :postId")
    void updateReplyCount(@Param("postId") Long postId);

    /**
     * Update last reply time
     */
    @Modifying
    @Query("UPDATE Post p SET p.lastReplyAt = :lastReplyAt WHERE p.id = :postId")
    void updateLastReplyTime(@Param("postId") Long postId, @Param("lastReplyAt") LocalDateTime lastReplyAt);

    /**
     * Count total active posts
     */
    long countByIsActiveTrue();

    /**
     * Count posts created since a specific time
     */
    long countByIsActiveTrueAndCreatedAtAfter(LocalDateTime since);

    /**
     * Get popular topics (by views and replies)
     */
    @Query("SELECT p FROM Post p JOIN FETCH p.category WHERE p.isActive = true ORDER BY (p.views + p.replyCount * 2) DESC")
    List<Post> findPopularTopics(Pageable pageable);

    /**
     * Count posts by category ID created since a specific time
     */
    long countByCategoryIdAndIsActiveTrueAndCreatedAtAfter(Long categoryId, LocalDateTime since);

    long countByCreatedAtAfter(LocalDateTime since);

    /**
     * Get all distinct tags from active posts
     */
    @Query(value = "SELECT tag_value as tag, COUNT(*) as count " +
            "FROM posts p " +
            "CROSS JOIN LATERAL unnest(string_to_array(LOWER(p.tags), ',')) AS tag_value " +
            "WHERE p.is_active = true AND p.tags IS NOT NULL AND p.tags != '' " +
            "GROUP BY tag_value " +
            "ORDER BY count DESC " +
            "LIMIT :limit",
            nativeQuery = true)
    List<Object[]> findPopularTags(@Param("limit") int limit);

}
