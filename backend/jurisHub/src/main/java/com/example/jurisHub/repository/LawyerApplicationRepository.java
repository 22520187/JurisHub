package com.example.jurisHub.repository;

import com.example.jurisHub.entity.LawyerApplication;
import com.example.jurisHub.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface LawyerApplicationRepository extends JpaRepository<LawyerApplication, Long> {

    Optional<LawyerApplication> findByUser(User user);

    boolean existsByUser(User user);

    Page<LawyerApplication> findByStatus(LawyerApplication.ApplicationStatus status, Pageable pageable);

    @Query("SELECT la FROM LawyerApplication la WHERE " +
            "(:status IS NULL OR la.status = :status) AND " +
            "(LOWER(la.user.fullName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "LOWER(la.user.email) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "LOWER(la.licenseNumber) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<LawyerApplication> findByStatusAndSearch(
            @Param("status") LawyerApplication.ApplicationStatus status,
            @Param("search") String search,
            Pageable pageable
    );

    Long countByStatus(LawyerApplication.ApplicationStatus status);

    long countByStatusAndReviewedAtAfter(LawyerApplication.ApplicationStatus status, LocalDateTime since);
}
