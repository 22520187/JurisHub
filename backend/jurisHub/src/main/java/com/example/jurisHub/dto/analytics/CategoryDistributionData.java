package com.example.jurisHub.dto.analytics;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for category distribution analytics
 * Shows how posts are distributed across different legal categories
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CategoryDistributionData {
    /**
     * Category name
     */
    private String name;

    /**
     * Number of posts in this category (used for pie chart value)
     */
    private int value;

    /**
     * Total posts in this category
     */
    private int posts;

    /**
     * Number of lawyers specializing in this category
     */
    private int lawyers;

}
