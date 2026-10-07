package com.example.jurisHub.dto.analytics;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SentimentData {
    private long totalAnalyzed;
    private long positiveCount;
    private long neutralCount;
    private long negativeCount;
    private double positivePercentage;
    private double neutralPercentage;
    private double negativePercentage;
    
    private List<SentimentTrend> trend;
    private List<TopSentimentPost> topPositivePosts;
    private List<TopSentimentPost> topNegativePosts;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SentimentTrend {
        private String date;
        private long positive;
        private long neutral;
        private long negative;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TopSentimentPost {
        private Long id;
        private String title;
        private String sentiment;
        private double score;
        private String authorName;
    }
}
