package com.example.jurisHub.dto.admin;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PostModerationDto {
    private Long id;
    private String title;
    private String content;
    private String categoryName;
    private AuthorDto author;
    private Integer views;
    private Integer replyCount;
    private Boolean isActive;
    private Boolean isPinned;
    private Boolean isHot;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private String violationReason; // Admin's note about violation
    private Boolean isReported;
    private Integer reportCount;
    private List<String> reportReasons; // User report reasons

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AuthorDto {
        private Long id;
        private String fullName;
        private String email;
        private String avatar;
        private String role;
    }
}
