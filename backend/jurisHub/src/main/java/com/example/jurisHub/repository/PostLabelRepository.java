package com.example.jurisHub.repository;

import com.example.jurisHub.entity.PostLabel;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PostLabelRepository extends JpaRepository<PostLabel, Long> {
    Optional<PostLabel> findBySlug(String slug);

    List<PostLabel> findByIsActiveTrue();

    List<PostLabel> findByCategoryIdAndIsActiveTrue(Long categoryId);

    List<PostLabel> findByCategoryId(Long categoryId);

    List<PostLabel> findByCategoryIdIsNullAndIsActiveTrue(); // Global labels

    boolean existsBySlug(String slug);
}
