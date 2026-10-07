package com.example.jurisHub.dto.analytics;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for content quality metrics
 * Evaluates quality scores across different dimensions
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QualityMetricData {
    /**
     * Category or dimension being measured
     * (e.g., "Response Quality", "Post Relevance", "User Satisfaction")
     */
    private String category;

    /**
     * Quality score (0-100 scale)
     */
    private double score;
}
