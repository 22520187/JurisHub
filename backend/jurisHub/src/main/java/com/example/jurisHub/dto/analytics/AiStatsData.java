package com.example.jurisHub.dto.analytics;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

/**
 * DTO for AI usage statistics
 * Tracks number of uses for each service and peak usage times
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiStatsData {
    /**
     * Total number of AI conversations (QA + PDF_QA)
     */
    private long totalConversations;

    /**
     * Total number of AI messages
     */
    private long totalMessages;

    /**
     * Map of service type to usage count
     * Keys: "QA", "PDF_QA"
     */
    private Map<String, Long> serviceUsage;

    /**
     * Usage timeline for the specified period
     */
    private List<TimeSeriesDataPoint> usageTimeline;

    /**
     * Hourly usage patterns across 24h period
     */
    private List<HourlyActivityData> hourlyPatterns;

    /**
     * Percentage increase/decrease compared to previous period
     */
    private double usageGrowth;
}
