package com.example.jurisHub.dto.admin;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminDashboardStatsDto {
    private long totalUsers;
    private long totalPosts;
    private long totalLawyers;
    private long totalCategories;

    private long pendingApplications;
    private long activeUsers; // users active in last 30 days
    private long reportedPosts;
    private long unresolvedReports;

    private long newUsersThisMonth;
    private long newPostsThisMonth;
    private long newLawyersThisMonth;

    private long totalMessages;
    private long totalConversations;

    private List<RecentActivityDto> recentActivities;

    private LocalDateTime lastUpdated;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RecentActivityDto {
        private String type; // USER_REGISTERED, POST_CREATED, LAWYER_APPLIED, etc.
        private String description;
        private LocalDateTime timestamp;
        private String userEmail;
        private Long entityId;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PopularContentDto {
        private Long postId;
        private String title;
        private String categoryName;
        private int views;
        private int replies;
        private LocalDateTime createdAt;
    }

    private List<PopularContentDto> popularPosts;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UserRoleStatsDto {
        private String role;
        private long count;
        private long activeCount; // active in last 30 days
    }

    private List<UserRoleStatsDto> usersByRole;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MonthlyGrowthDto {
        private String month; // "2024-01", "2024-02", etc.
        private long users;
        private long lawyers;
        private long posts;
    }

    private List<MonthlyGrowthDto> monthlyGrowth;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class WeeklyActivityDto {
        private String day; // "Monday", "Tuesday", etc.
        private long posts;
        private long replies;
        private long views;
    }

    private List<WeeklyActivityDto> weeklyActivity;
}
