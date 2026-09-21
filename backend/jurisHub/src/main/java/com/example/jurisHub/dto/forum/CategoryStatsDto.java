package com.example.jurisHub.dto.forum;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for category statistics
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CategoryStatsDto {

    private Long id;
    private String name;
    private String slug;
    private String icon;
    private Long topicCount;
    private Long totalPostCount;
    private Long topicsToday;
}
