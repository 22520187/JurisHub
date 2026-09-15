package com.example.jurisHub.repository;

import com.example.jurisHub.entity.Post;
import com.example.jurisHub.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

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

}
