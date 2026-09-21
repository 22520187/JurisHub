package com.example.jurisHub.dto.forum;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for forum statistics
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ForumStatsDto {
    private Long totalTopics;
    private Long totalPosts;
    private Long totalMembers;
    private Long topicsToday;
    private Long postsToday;
    private Long membersToday;
}
