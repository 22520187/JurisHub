package com.example.jurisHub.dto.analytics;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for user retention analytics
 * Tracks how many users continue to use the platform over time
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserRetentionData {
    
    /**
     * Time period label (e.g., "2024-01", "Week 1")
     */
    private String period;
    
    /**
     * Number of users retained from previous period
     */
    private int retained;
    
    /**
     * Number of active users in this period
     */
    private int active;
    
    /**
     * Retention rate as percentage (0-100)
     */
    private double rate;
}
