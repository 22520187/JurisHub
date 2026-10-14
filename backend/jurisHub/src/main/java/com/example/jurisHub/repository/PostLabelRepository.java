package com.example.jurisHub.repository;

import com.example.jurisHub.entity.PostLabel;
import org.springframework.data.jpa.repository.JpaRepository;

import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface PostLabelRepository extends JpaRepository<PostLabel, Long> {
    Optional<PostLabel> findBySlug(String slug);

    List<PostLabel> findByIsActiveTrue();

    List<PostLabel> findByCategoryIdAndIsActiveTrue(Long categoryId);

    List<PostLabel> findByCategoryId(Long categoryId);

    List<PostLabel> findByCategoryIdIsNullAndIsActiveTrue(); // Global labels

    boolean existsBySlug(String slug);

    @Modifying
    @Query(value = "DELETE FROM jurishub.post_label_mapping WHERE label_id = :labelId", nativeQuery = true)
    void deletePostLabelMappingsByLabelId(@Param("labelId") Long labelId);
}
