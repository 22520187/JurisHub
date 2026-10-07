package com.example.jurisHub.dto.analytics;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for user growth analytics data
 * Represents user registration trends over time periods
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserGrowthData {
    /**
     * Time period label (e.g., "2024-01", "Week 1", "Jan 1")
     */
    private String period;

    /**
     * Total number of regular users registered in this period
     */
    private int users;

    /**
     * Total number of lawyers registered in this period
     */
    private int lawyers;

    /**
     * Total number of posts created in this period
     */
    private int posts;

    /**
     * Growth percentage compared to previous period (can be negative)
     */
    private double growth;
}
