package com.example.jurisHub.dto.analytics;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for engagement analytics
 * Tracks user interaction metrics over time
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EngagementData {
    /**
     * Time period label (e.g., "2024-01", "Week 1")
     */
    private String period;

    /**
     * Number of posts created in this period
     */
    private int posts;

    /**
     * Number of replies posted in this period
     */
    private int replies;

    /**
     * Number of post views in this period
     */
    private int views;

    /**
     * Number of likes/votes in this period
     */
    private int likes;
}
