package com.example.jurisHub.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "api_keys")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ApiKey {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "api_key", nullable = false, unique = true, length = 64)
    private String key;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "total_limit", nullable = false)
    @Builder.Default
    private Integer totalLimit = 5;

    @Column(name = "used_count", nullable = false)
    @Builder.Default
    private Integer usedCount = 0;

    @Column(name = "pdf_qa_count", nullable = false)
    @Builder.Default
    private Integer pdfQaCount = 0;

    @Column(name = "chat_qa_count", nullable = false)
    @Builder.Default
    private Integer chatQaCount = 0;

    @Column(name = "is_active")
    @Builder.Default
    private Boolean isActive = true;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "expires_at")
    private LocalDateTime expiresAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (expiresAt == null) {
            expiresAt = LocalDateTime.now().plusDays(30);
        }
    }

    public boolean hasRemainingCalls() {
        return usedCount < totalLimit && isActive &&
                (expiresAt == null || LocalDateTime.now().isBefore(expiresAt));
    }

    public int getRemainingCalls() {
        return Math.max(0, totalLimit - usedCount);
    }

    public void incrementUsage(String type) {
        this.usedCount++;
        if ("pdf".equalsIgnoreCase(type)) {
            this.pdfQaCount++;
        } else if ("chat".equalsIgnoreCase(type)) {
            this.chatQaCount++;
        }
    }
}
