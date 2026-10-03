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
}
