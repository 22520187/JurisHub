package com.example.jurisHub.dto.analytics;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

/**
 * Generic time series data point for analytics
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TimeSeriesDataPoint {
    private String period; // Format: "2025-01-15" or "2025-W03" or "2025-01"
    private LocalDate date;
    private Long value;
    private Double percentage;
    private String label;
}
