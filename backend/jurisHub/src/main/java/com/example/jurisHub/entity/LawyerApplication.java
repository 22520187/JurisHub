package com.example.jurisHub.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;


import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "lawyer_applications")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LawyerApplication {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "license_number", nullable = false)
    private String licenseNumber;

    @Column(name = "law_school", nullable = false)
    private String lawSchool;

    @Column(name = "graduation_year", nullable = false)
    private Integer graduationYear;

    @Column(name = "specializations")
    private String specializations; // JSON array or comma-separated

    @Column(name = "years_of_experience")
    private Integer yearsOfExperience;

    @Column(name = "current_firm")
    private String currentFirm;

    @Column(name = "bio", columnDefinition = "TEXT")
    private String bio;

    @Column(name = "phone_number")
    private String phoneNumber;

    @Column(name = "office_address")
    private String officeAddress;

    @Column(name = "document_urls", columnDefinition = "TEXT")
    private String documentUrlsJson;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private ApplicationStatus status = ApplicationStatus.PENDING;

    @Column(name = "admin_notes", columnDefinition = "TEXT")
    private String adminNotes;

    @Column(name = "reviewed_by")
    private Long reviewedBy; // Admin user ID

    @Column(name = "reviewed_at")
    private LocalDateTime reviewedAt;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public enum ApplicationStatus {
        PENDING, APPROVED, REJECTED
    }

    public List<String> getDocumentUrls() {
        if (documentUrlsJson == null || documentUrlsJson.isEmpty()) {
            return new ArrayList<>();
        }
        try {
            ObjectMapper mapper = new ObjectMapper();
            return mapper.readValue(documentUrlsJson, new TypeReference<List<String>>() {});
        } catch (JsonProcessingException e) {
            return new ArrayList<>();
        }
    }

    public void setDocumentUrls(List<String> documentUrls) {
        if (documentUrls == null || documentUrls.isEmpty()) {
            this.documentUrlsJson = null;
            return;
        }
        try {
            ObjectMapper mapper = new ObjectMapper();
            this.documentUrlsJson = mapper.writeValueAsString(documentUrls);
        } catch (JsonProcessingException e) {
            this.documentUrlsJson = null;
        }
    }
}
