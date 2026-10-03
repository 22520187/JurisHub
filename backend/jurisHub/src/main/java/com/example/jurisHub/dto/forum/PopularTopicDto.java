package com.example.jurisHub.dto.forum;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for popular topics (simplified version for sidebar)
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PopularTopicDto {
    
    private Long id;
    private String title;
    private String slug;
    private String categoryName;
    private String categorySlug;
    private Integer views;
    private Integer replyCount;
    private String badge;
}
