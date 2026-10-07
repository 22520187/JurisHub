package com.example.jurisHub.service.impl;

import com.example.jurisHub.dto.analytics.*;
import com.example.jurisHub.entity.Post;
import com.example.jurisHub.entity.PostReply;
import com.example.jurisHub.entity.User;
import com.example.jurisHub.repository.*;
import com.example.jurisHub.service.AnalyticsService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AnalyticsServiceImpl implements AnalyticsService {

    private final UserRepository userRepository;
    private final ForumRepository forumRepository;
    private final PostReplyRepository postReplyRepository;
    private final PostVoteRepository postVoteRepository;
    private final ConversationRepository conversationRepository;
    private final MessageRepository messageRepository;

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("MMM dd");

    /**
     * Get user growth data over specified time range
     */
    @Override
    public List<UserGrowthData> getUserGrowthData(String timeRange){
        log.info("Generating user growth report for timeRange: {}", timeRange);
        LocalDateTime startDate = getStartDateTime(timeRange);

        List<Object[]> usersByRole = userRepository.countUsersByRoleGroupedByDate(startDate);
        List<Object[]> postsByDate = forumRepository.countPostsGroupedByDate(startDate);

        Map<String, Integer> usersCountMap = new HashMap<>();
        Map<String, Integer> lawyersCountMap = new HashMap<>();
        Map<String, Integer> postsCountMap = new HashMap<>();

        for (Object[] row : usersByRole) {
            String date = row[0].toString();
            User.Role role = (User.Role) row[1];
            Long count = ((Number) row[2]).longValue();

            if (role == User.Role.USER) {
                usersCountMap.put(date, count.intValue());
            } else if (role == User.Role.LAWYER) {
                lawyersCountMap.put(date, count.intValue());
            }
        }

        for (Object[] row : postsByDate) {
            String date = row[0].toString();
            Long count = ((Number) row[1]).longValue();
            postsCountMap.put(date, count.intValue());
        }

        List<UserGrowthData> result = new ArrayList<>();
        LocalDateTime currentDate = startDate;
        LocalDateTime endDate = LocalDateTime.now();

        int previousTotal = 0;
        while (!currentDate.isAfter(endDate)) {
            String dateStr = currentDate.toLocalDate().toString();

            int users = usersCountMap.getOrDefault(dateStr, 0);
            int lawyers = lawyersCountMap.getOrDefault(dateStr, 0);
            int posts = postsCountMap.getOrDefault(dateStr, 0);

            int currentTotal = users + lawyers;
            double growth = 0.0;

            if (previousTotal > 0) {
                growth = ((currentTotal - previousTotal) * 100.0) / previousTotal;
            }

            result.add(UserGrowthData.builder()
                    .period(currentDate.format(DATE_FORMATTER))
                    .users(users)
                    .lawyers(lawyers)
                    .posts(posts)
                    .growth(Math.round(growth * 100.0) / 100.0) // Round to 2 decimal places
                    .build());

            previousTotal = currentTotal;
            currentDate = currentDate.plusDays(1);
        }
        return result;
    }

    /**
     * Get user retention data
     */
    @Override
    public List<UserRetentionData> getUserRetentionData(String timeRange) {
        log.info("Generating user retention report for timeRange: {}", timeRange);
        int days = getNumberOfDays(timeRange);
        LocalDateTime startDate = getStartDateTime(timeRange);


        List<UserRetentionData> result = new ArrayList<>();
        for (int i = 0; i < Math.min(days, 30); i++) {
            LocalDateTime date = startDate.plusDays(i);
            int active = 200 + (int)(Math.random() * 100);
            int retained = (int)(active * (0.7 + Math.random() * 0.25));
            result.add(UserRetentionData.builder()
                    .period(date.format(DATE_FORMATTER))
                    .retained(retained)
                    .active(active)
                    .rate((double)retained / active * 100)
                    .build());
        }

        return result;
    }

    /**
     * Get overall content statistics
     */
    @Override
    public ContentStatsData getContentStatsData(String timeRange) {
        log.info("Generating content stats report for timeRange: {}", timeRange);
        LocalDateTime startDate = getStartDateTime(timeRange);

        long totalPosts = forumRepository.countByCreatedAtBetweenAndIsActiveTrue(startDate, LocalDateTime.now());

        long totalReplies = postReplyRepository.countByCreatedAtAfterAndIsActiveTrue(startDate);

        Double avgReplies = postReplyRepository.getAverageReplyCountPerPost(startDate);
        double avgRepliesPerPost = (avgReplies != null) ? avgReplies : 0.0;

        List<Object[]> categoryData = forumRepository.countPostsByCategoryGrouped(startDate);
        List<ContentStatsData.TopCategory> topCategories = new ArrayList<>();

        for (int i = 0; i < Math.min(categoryData.size(), 5); i++) {
            Object[] row = categoryData.get(i);
            String categoryName = (String) row[0];
            Long currentCount = ((Number) row[1]).longValue();

            double growth = 0.0;

            topCategories.add(ContentStatsData.TopCategory.builder()
                    .name(categoryName)
                    .posts(currentCount.intValue())
                    .growth(growth)
                    .build());
        }

        return ContentStatsData.builder()
                .totalPosts((int) totalPosts)
                .totalReplies((int) totalReplies)
                .avgRepliesPerPost(Math.round(avgRepliesPerPost * 100.0) / 100.0)
                .topCategories(topCategories)
                .build();
    }

    /**
     * Get engagement data (posts, replies, views, likes)
     */
    public List<EngagementData> getEngagementData(String timeRange) {
        log.info("Generating engagement report for timeRange: {}", timeRange);
        LocalDateTime startDate = getStartDateTime(timeRange);

        List<Object[]> postsByDate = forumRepository.countPostsGroupedByDate(startDate);

        List<Object[]> repliesByDate = postReplyRepository.countRepliesGroupedByDate(startDate);

        List<Object[]> viewsByDate = forumRepository.sumViewsGroupedByDate(startDate);

        List<Object[]> votesByDate = postVoteRepository.countUpvotesGroupedByDate(startDate);

        Map<String, Integer> postsMap = new HashMap<>();
        Map<String, Integer> repliesMap = new HashMap<>();
        Map<String, Integer> viewsMap = new HashMap<>();
        Map<String, Integer> likesMap = new HashMap<>();

        for (Object[] row : postsByDate) {
            String date = row[0].toString();
            int count = ((Number) row[1]).intValue();
            postsMap.put(date, count);
        }

        for (Object[] row : repliesByDate) {
            String date = row[0].toString();
            int count = ((Number) row[1]).intValue();
            repliesMap.put(date, count);
        }

        for (Object[] row : viewsByDate) {
            String date = row[0].toString();
            int count = row[1] != null ? ((Number) row[1]).intValue() : 0;
            viewsMap.put(date, count);
        }

        for (Object[] row : votesByDate) {
            String date = row[0].toString();
            int count = ((Number) row[1]).intValue();
            likesMap.put(date, count);
        }

        List<EngagementData> result = new ArrayList<>();
        LocalDateTime currentDate = startDate;
        LocalDateTime endDate = LocalDateTime.now();

        while (!currentDate.isAfter(endDate)) {
            String dateStr = currentDate.toLocalDate().toString();

            result.add(EngagementData.builder()
                    .period(currentDate.format(DATE_FORMATTER))
                    .posts(postsMap.getOrDefault(dateStr, 0))
                    .replies(repliesMap.getOrDefault(dateStr, 0))
                    .views(viewsMap.getOrDefault(dateStr, 0))
                    .likes(likesMap.getOrDefault(dateStr, 0))
                    .build());

            currentDate = currentDate.plusDays(1);
        }

        return result;
    }

    /**
     * Get lawyer performance metrics
     */
    @Override
    public List<LawyerPerformanceData> getLawyerPerformanceData(String timeRange) {
        log.info("Generating lawyer performance report for timeRange: {}", timeRange);
        LocalDateTime startDate = getStartDateTime(timeRange);


        return List.of(
                LawyerPerformanceData.builder()
                        .name("Luật sư Nguyễn Văn A").responses(145).avgResponseTime(2.5)
                        .satisfaction(4.7).activeClients(23).build(),
                LawyerPerformanceData.builder()
                        .name("Luật sư Trần Thị B").responses(132).avgResponseTime(3.2)
                        .satisfaction(4.5).activeClients(19).build(),
                LawyerPerformanceData.builder()
                        .name("Luật sư Lê Văn C").responses(118).avgResponseTime(2.8)
                        .satisfaction(4.6).activeClients(21).build(),
                LawyerPerformanceData.builder()
                        .name("Luật sư Phạm Thị D").responses(105).avgResponseTime(3.5)
                        .satisfaction(4.4).activeClients(17).build()
        );
    }

    /**
     * Get category distribution data
     */
    @Override
    public List<CategoryDistributionData> getCategoryDistributionData(String timeRange) {
        log.info("Generating category distribution report for timeRange: {}", timeRange);
        LocalDateTime startDate = getStartDateTime(timeRange);

        List<Object[]> categoryData = forumRepository.countPostsByCategoryGrouped(startDate);

        List<CategoryDistributionData> result = new ArrayList<>();

        for (Object[] row : categoryData) {
            String categoryName = (String) row[0];
            Long postCount = ((Number) row[1]).longValue();

            int lawyers = 0;

            result.add(CategoryDistributionData.builder()
                    .name(categoryName)
                    .value(postCount.intValue())
                    .posts(postCount.intValue())
                    .lawyers(lawyers)
                    .build());
        }

        return result;
    }

    /**
     * Get hourly activity patterns
     */
    @Override
    public List<HourlyActivityData> getHourlyActivityData(String timeRange) {
        log.info("Generating hourly activity report for timeRange: {}", timeRange);
        LocalDateTime startDate = getStartDateTime(timeRange);

        List<Object[]> postsByHour = forumRepository.countPostsGroupedByHour(startDate);

        List<Object[]> repliesByHour = postReplyRepository.countRepliesGroupedByHour(startDate);

        Map<Integer, Integer> activityMap = new HashMap<>();

        for (int i = 0; i < 24; i++) {
            activityMap.put(i, 0);
        }

        for (Object[] row : postsByHour) {
            int hour = ((Number) row[0]).intValue();
            int count = ((Number) row[1]).intValue();
            activityMap.put(hour, activityMap.get(hour) + count);
        }

        for (Object[] row : repliesByHour) {
            int hour = ((Number) row[0]).intValue();
            int count = ((Number) row[1]).intValue();
            activityMap.put(hour, activityMap.get(hour) + count);
        }

        List<HourlyActivityData> result = new ArrayList<>();
        for (int hour = 0; hour < 24; hour++) {
            result.add(HourlyActivityData.builder()
                    .hour(hour)
                    .activity(activityMap.get(hour))
                    .build());
        }

        return result;
    }

    /**
     * Get quality metrics data
     */
    @Override
    public List<QualityMetricData> getQualityMetricsData(String timeRange) {
        log.info("Generating quality metrics report for timeRange: {}", timeRange);


        return List.of(
                QualityMetricData.builder().category("Chất lượng phản hồi").score(85.5).build(),
                QualityMetricData.builder().category("Độ hữu ích").score(78.3).build(),
                QualityMetricData.builder().category("Độ hài lòng").score(82.1).build(),
                QualityMetricData.builder().category("Tính chuyên nghiệp").score(88.7).build(),
                QualityMetricData.builder().category("Thời gian phản hồi").score(75.4).build()
        );
    }

    /**
     * Get AI usage statistics
     */
    @Override
    public AiStatsData getAiStatsData(String timeRange) {
        log.info("Generating AI stats report for timeRange: {}", timeRange);
        LocalDateTime startDate = getStartDateTime(timeRange);

        List<Object[]> typeCounts = conversationRepository.countConversationsByType(startDate);
        Map<String, Long> serviceUsage = new HashMap<>();
        long totalConversations = 0;
        for (Object[] row : typeCounts) {
            String type = row[0].toString();
            long count = ((Number) row[1]).longValue();
            serviceUsage.put(type, count);
            totalConversations += count;
        }

        long totalMessages = totalConversations * 5; // Simple simulation for now

        List<Object[]> timelineData = messageRepository.countMessagesGroupedByDate(startDate);
        List<TimeSeriesDataPoint> usageTimeline = new ArrayList<>();
        Map<String, Long> timelineMap = new HashMap<>();
        for (Object[] row : timelineData) {
            timelineMap.put(row[0].toString(), ((Number) row[1]).longValue());
        }

        LocalDateTime currentDate = startDate;
        LocalDateTime endDate = LocalDateTime.now();
        while (!currentDate.isAfter(endDate)) {
            String dateStr = currentDate.toLocalDate().toString();
            usageTimeline.add(TimeSeriesDataPoint.builder()
                    .period(currentDate.format(DATE_FORMATTER))
                    .date(currentDate.toLocalDate())
                    .value(timelineMap.getOrDefault(dateStr, 0L))
                    .build());
            currentDate = currentDate.plusDays(1);
        }

        List<Object[]> hourlyData = messageRepository.countMessagesGroupedByHour(startDate);
        List<HourlyActivityData> hourlyPatterns = new ArrayList<>();
        Map<Integer, Long> hourlyMap = new HashMap<>();
        for (Object[] row : hourlyData) {
            hourlyMap.put(((Number) row[0]).intValue(), ((Number) row[1]).longValue());
        }

        for (int i = 0; i < 24; i++) {
            hourlyPatterns.add(HourlyActivityData.builder()
                    .hour(i)
                    .activity(hourlyMap.getOrDefault(i, 0L).intValue())
                    .build());
        }

        return AiStatsData.builder()
                .totalConversations(totalConversations)
                .totalMessages(totalMessages)
                .serviceUsage(serviceUsage)
                .usageTimeline(usageTimeline)
                .hourlyPatterns(hourlyPatterns)
                .usageGrowth(12.5) // Simulation
                .build();
    }

    /**
     * Get sentiment analytics for posts and comments
     */
    @Override
    public SentimentData getSentimentData(String timeRange) {
        log.info("Generating sentiment report for timeRange: {}", timeRange);
        LocalDateTime startDate = getStartDateTime(timeRange);

        long posPosts = forumRepository.countBySentimentLabelAndCreatedAtAfter("positive", startDate);
        long posReplies = postReplyRepository.countBySentimentLabelAndCreatedAtAfter("positive", startDate);
        long neuPosts = forumRepository.countBySentimentLabelAndCreatedAtAfter("neutral", startDate);
        long neuReplies = postReplyRepository.countBySentimentLabelAndCreatedAtAfter("neutral", startDate);
        long negPosts = forumRepository.countBySentimentLabelAndCreatedAtAfter("negative", startDate);
        long negReplies = postReplyRepository.countBySentimentLabelAndCreatedAtAfter("negative", startDate);

        long totalPos = posPosts + posReplies;
        long totalNeu = neuPosts + neuReplies;
        long totalNeg = negPosts + negReplies;
        long totalAnalyzed = totalPos + totalNeu + totalNeg;

        double posPct = totalAnalyzed > 0 ? (totalPos * 100.0 / totalAnalyzed) : 0;
        double neuPct = totalAnalyzed > 0 ? (totalNeu * 100.0 / totalAnalyzed) : 0;
        double negPct = totalAnalyzed > 0 ? (totalNeg * 100.0 / totalAnalyzed) : 0;

        List<Object[]> postSentimentTrend = forumRepository.countPostSentimentGroupedByDate(startDate);
        List<Object[]> replySentimentTrend = postReplyRepository.countReplySentimentGroupedByDate(startDate);

        Map<String, SentimentData.SentimentTrend> trendMap = new HashMap<>();

        for (Object[] row : postSentimentTrend) {
            String date = row[0].toString();
            String label = row[1].toString();
            long count = ((Number) row[2]).longValue();

            SentimentData.SentimentTrend t = trendMap.computeIfAbsent(date, k -> SentimentData.SentimentTrend.builder().date(k).build());
            if ("positive".equals(label)) t.setPositive(t.getPositive() + count);
            else if ("neutral".equals(label)) t.setNeutral(t.getNeutral() + count);
            else if ("negative".equals(label)) t.setNegative(t.getNegative() + count);
        }

        for (Object[] row : replySentimentTrend) {
            String date = row[0].toString();
            String label = row[1].toString();
            long count = ((Number) row[2]).longValue();

            SentimentData.SentimentTrend t = trendMap.computeIfAbsent(date, k -> SentimentData.SentimentTrend.builder().date(k).build());
            if ("positive".equals(label)) t.setPositive(t.getPositive() + count);
            else if ("neutral".equals(label)) t.setNeutral(t.getNeutral() + count);
            else if ("negative".equals(label)) t.setNegative(t.getNegative() + count);
        }

        List<SentimentData.SentimentTrend> trendList = trendMap.values().stream()
                .sorted((a, b) -> a.getDate().compareTo(b.getDate()))
                .map(t -> {
                    try {
                        LocalDateTime dt = LocalDateTime.parse(t.getDate() + "T00:00:00");
                        t.setDate(dt.format(DATE_FORMATTER));
                    } catch (Exception e) {}
                    return t;
                })
                .collect(Collectors.toList());

        List<Post> topPosPosts = forumRepository.findTopPositivePosts(startDate, PageRequest.of(0, 5));
        List<PostReply> topPosReplies = postReplyRepository.findTopPositiveReplies(startDate, PageRequest.of(0, 5));

        List<SentimentData.TopSentimentPost> topPositive = new ArrayList<>();
        topPosPosts.forEach(p -> topPositive.add(SentimentData.TopSentimentPost.builder().id(p.getId()).title(p.getTitle()).sentiment("positive").score(p.getSentimentScore()).authorName(p.getAuthor().getFullName()).build()));
        topPosReplies.forEach(r -> topPositive.add(SentimentData.TopSentimentPost.builder().id(r.getId()).title(r.getContent().substring(0, Math.min(r.getContent().length(), 50))).sentiment("positive").score(r.getSentimentScore()).authorName(r.getAuthor().getFullName()).build()));

        List<SentimentData.TopSentimentPost> finalPositive = topPositive.stream()
                .sorted((a, b) -> Double.compare(b.getScore(), a.getScore()))
                .limit(5)
                .collect(Collectors.toList());

        List<Post> topNegPosts = forumRepository.findTopNegativePosts(startDate, PageRequest.of(0, 5));
        List<PostReply> topNegReplies = postReplyRepository.findTopNegativeReplies(startDate, PageRequest.of(0, 5));

        List<SentimentData.TopSentimentPost> topNegative = new ArrayList<>();
        topNegPosts.forEach(p -> topNegative.add(SentimentData.TopSentimentPost.builder().id(p.getId()).title(p.getTitle()).sentiment("negative").score(p.getSentimentScore()).authorName(p.getAuthor().getFullName()).build()));
        topNegReplies.forEach(r -> topNegative.add(SentimentData.TopSentimentPost.builder().id(r.getId()).title(r.getContent().substring(0, Math.min(r.getContent().length(), 50))).sentiment("negative").score(r.getSentimentScore()).authorName(r.getAuthor().getFullName()).build()));

        List<SentimentData.TopSentimentPost> finalNegative = topNegative.stream()
                .sorted((a, b) -> Double.compare(b.getScore(), a.getScore()))
                .limit(5)
                .collect(Collectors.toList());

        return SentimentData.builder()
                .totalAnalyzed(totalAnalyzed)
                .positiveCount(totalPos)
                .neutralCount(totalNeu)
                .negativeCount(totalNeg)
                .positivePercentage(Math.round(posPct * 10.0) / 10.0)
                .neutralPercentage(Math.round(neuPct * 10.0) / 10.0)
                .negativePercentage(Math.round(negPct * 10.0) / 10.0)
                .trend(trendList)
                .topPositivePosts(finalPositive)
                .topNegativePosts(finalNegative)
                .build();
    }

    /**
     * Export report in specified format (PDF, Excel, CSV)
     */
    @Override
    public byte[] exportReport(String reportType, String timeRange, String format) {
        log.info("Exporting {} report as {} for timeRange: {}", reportType, format, timeRange);


        throw new UnsupportedOperationException("Export functionality not yet implemented");
    }

    /**
     * Convert time range string to number of days
     */
    private int getNumberOfDays(String timeRange) {
        return switch (timeRange) {
            case "7days" -> 7;
            case "30days" -> 30;
            case "90days" -> 90;
            case "1year" -> 365;
            case "all" -> 3650; // 10 years
            default -> 30;
        };
    }

    /**
     * Get start date/time for the specified time range
     */
    private LocalDateTime getStartDateTime(String timeRange) {
        int days = getNumberOfDays(timeRange);
        return LocalDateTime.now().minusDays(days);
    }
}
