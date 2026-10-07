package com.example.jurisHub.dto.analytics;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for lawyer performance metrics
 * Tracks individual lawyer activity and effectiveness
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LawyerPerformanceData {
    /**
     * Lawyer's full name
     */
    private String name;

    /**
     * Number of responses/replies provided by this lawyer
     */
    private int responses;

    /**
     * Average response time in hours
     */
    private double avgResponseTime;

    /**
     * Client satisfaction score (0-5 scale)
     */
    private double satisfaction;

    /**
     * Number of currently active clients/cases
     */
    private int activeClients;
}
