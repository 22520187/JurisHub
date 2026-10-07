package com.example.jurisHub.repository;

import com.example.jurisHub.entity.PostCategory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PostCategoryRepository extends JpaRepository<PostCategory, Long> {
    /**
     * Find category by slug
     */
    Optional<PostCategory> findBySlug(String slug);

    /**
     * Find all active categories ordered by display order
     */
    List<PostCategory> findByIsActiveTrueOrderByDisplayOrderAsc();

    /**
     * Check if slug exists (for unique validation)
     */
    boolean existsBySlug(String slug);

    /**
     * Check if slug exists for different category (for update validation)
     */
    boolean existsBySlugAndIdNot(String slug, Long id);

    /**
     * Find category by name (case insensitive)
     */
    Optional<PostCategory> findByNameIgnoreCase(String name);
}
