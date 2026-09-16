package com.example.jurisHub.dto.forum;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PostCategoryDto implements Serializable {
    private static final long serialVersionUID = 1L;
    private Long id;

    private String slug;

    private String name;

    private String description;

    private String icon;

    private Integer displayOrder;

    private Boolean isActive;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createdAt;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime updatedAt;

    private Integer threadCount;

    private Integer postCount;

    private List<PostLabelDto> labels;

    private PostSummaryDto lastPost;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class PostSummaryDto implements Serializable {
        private static final long serialVersionUID = 2L;
        private Long id;
        private String title;
        private String slug;
        private String authorName;
        private String authorRole;
        private String authorAvatar;
        private Integer views;
        @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
        private LocalDateTime createdAt;
    }

}
