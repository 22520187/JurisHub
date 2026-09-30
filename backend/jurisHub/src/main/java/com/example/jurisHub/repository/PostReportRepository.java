package com.example.jurisHub.repository;

import com.example.jurisHub.entity.PostReport;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface PostReportRepository extends JpaRepository<PostReport, Long> {
    List<PostReport> findByPostIdOrderByCreatedAtDesc(Long postId);

    List<PostReport> findByReporterIdOrderByCreatedAtDesc(Long reporterId);

    boolean existsByPostIdAndReporterId(Long postId, Long reporterId);

    long countByStatus(PostReport.ReportStatus status);

    @Query("SELECT pr FROM PostReport pr " +
            "LEFT JOIN FETCH pr.post p " +
            "LEFT JOIN FETCH pr.reporter r " +
            "WHERE pr.status = :status " +
            "ORDER BY pr.createdAt DESC")
    List<PostReport> findAllByStatusWithDetails(@Param("status") PostReport.ReportStatus status);

    @Query("SELECT pr FROM PostReport pr " +
            "LEFT JOIN FETCH pr.post " +
            "LEFT JOIN FETCH pr.reporter " +
            "LEFT JOIN FETCH pr.reviewedBy " +
            "WHERE pr.id = :id")
    Optional<PostReport> findByIdWithDetails(@Param("id") Long id);
}
