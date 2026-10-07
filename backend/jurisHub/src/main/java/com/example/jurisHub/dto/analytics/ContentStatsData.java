package com.example.jurisHub.dto.analytics;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * DTO for overall content statistics
 * Provides aggregate metrics about posts, replies, and categories
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ContentStatsData {
    /**
     * Total number of posts in the system
     */
    private int totalPosts;

    /**
     * Total number of replies across all posts
     */
    private int totalReplies;

    /**
     * Average number of replies per post
     */
    private double avgRepliesPerPost;

    /**
     * List of top performing categories
     */
    private List<TopCategory> topCategories;

    /**
     * Nested class for top category data
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TopCategory {
        /**
         * Category name
         */
        private String name;

        /**
         * Number of posts in this category
         */
        private int posts;

        /**
         * Growth percentage compared to previous period
         */
        private double growth;
    }
}
