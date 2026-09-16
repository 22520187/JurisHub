package com.example.jurisHub.dto.forum;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PostReplyDto {

    private Long id;

    private String content;

    private Long postId;

    private UserSummaryDto author;

    private Long parentId;

    private List<PostReplyDto> children;

    private Integer upvoteCount;

    private Integer downvoteCount;

    private String userVote; // "upvote", "downvote", or null

    private List<Long> mentionedUserIds;

    private Boolean isActive;

    private Boolean isSolution;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createdAt;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime updatedAt;

    private Boolean isTopLevel;

    private Integer childrenCount;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class UserSummaryDto {
        private Long id;
        private String name;
        private String email;
        private String role;
        private String avatar;
    }
}
