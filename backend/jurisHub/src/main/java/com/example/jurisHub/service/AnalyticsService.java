package com.example.jurisHub.service;

import com.example.jurisHub.dto.analytics.*;

import java.util.List;

public interface AnalyticsService {

    List<UserGrowthData> getUserGrowthData(String timeRange);

    List<UserRetentionData> getUserRetentionData(String timeRange);

    ContentStatsData getContentStatsData(String timeRange);

    List<EngagementData> getEngagementData(String timeRange);

    List<LawyerPerformanceData> getLawyerPerformanceData(String timeRange);

    List<CategoryDistributionData> getCategoryDistributionData(String timeRange);

    List<HourlyActivityData> getHourlyActivityData(String timeRange);

    List<QualityMetricData> getQualityMetricsData(String timeRange);

    AiStatsData getAiStatsData(String timeRange);

    SentimentData getSentimentData(String timeRange);

    byte[] exportReport(String reportType, String timeRange, String format);
}
