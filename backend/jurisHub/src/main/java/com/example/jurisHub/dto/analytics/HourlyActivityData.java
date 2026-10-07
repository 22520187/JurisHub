package com.example.jurisHub.dto.analytics;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for hourly activity patterns
 * Tracks user activity distribution across 24-hour period
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HourlyActivityData {
    /**
     * Hour of day (0-23)
     */
    private int hour;

    /**
     * Activity count in this hour (posts + replies + views)
     */
    private int activity;
}
