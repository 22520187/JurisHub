package com.example.jurisHub.repository;

import com.example.jurisHub.entity.PostReply;
import com.example.jurisHub.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface PostReplyRepository extends JpaRepository<PostReply, Long> {

    long countByAuthorAndIsActiveTrue(User author);

    /**
     * Count all replies for posts in a specific category
     */
    @Query("SELECT COUNT(r) FROM PostReply r WHERE r.post.category.id = :categoryId AND r.isActive = true")
    long countByCategoryId(@Param("categoryId") Long categoryId);
}
