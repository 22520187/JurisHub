package com.example.jurisHub.controller;

import com.example.jurisHub.dto.admin.*;
import com.example.jurisHub.dto.analytics.*;
import com.example.jurisHub.dto.common.ApiResponse;
import com.example.jurisHub.dto.forum.PostCategoryDto;
import com.example.jurisHub.service.AdminService;
import com.example.jurisHub.service.AnalyticsService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@Slf4j
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final AdminService adminService;
    private final AnalyticsService analyticsService;

    @GetMapping("/dashboard/stats")
    public ResponseEntity<ApiResponse<AdminDashboardStatsDto>> getDashboardStats() {
        log.info("Getting admin dashboard statistics");

        AdminDashboardStatsDto stats = adminService.getDashboardStatistics();
        return ResponseEntity.ok(ApiResponse.<AdminDashboardStatsDto>builder()
                .success(true)
                .message("Admin dashboard statistics retrieved successfully")
                .data(stats)
                .build());
    }

    @GetMapping("/users")
    public ResponseEntity<ApiResponse<Page<UserManagementDto>>> getAllUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String role) {

        Sort sort = Sort.by(sortDir.equalsIgnoreCase("desc") ?
                    Sort.Direction.DESC : Sort.Direction.ASC, sortBy);
        Pageable pageable = PageRequest.of(page, size, sort);

        Page<UserManagementDto> usersPage = adminService.getAllUsers(search, role, pageable);

        return ResponseEntity.ok(ApiResponse.<Page<UserManagementDto>>builder()
                .success(true)
                .message("Users retrieved successfully")
                .data(usersPage)
                .build());
    }

    @PutMapping("/users/{userId}/status")
    public ResponseEntity<ApiResponse<String>> updateUserStatus(
            @PathVariable Long userId,
            @RequestParam Boolean isEnabled) {

        adminService.updateUserStatus(userId, isEnabled);

        return ResponseEntity.ok(ApiResponse.<String>builder()
                .success(true)
                .message("User status updated successfully")
                .data("User " + (isEnabled ? "enabled" : "disabled"))
                .build());
    }

    @GetMapping("/posts")
    public ResponseEntity<ApiResponse<Page<PostModerationDto>>> getPostsForModeration(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Boolean isActive) {

        Sort sort = Sort.by(sortDir.equalsIgnoreCase("desc") ?
                Sort.Direction.DESC : Sort.Direction.ASC, sortBy);
        Pageable pageable = PageRequest.of(page, size, sort);

        Page<PostModerationDto> posts = adminService.getPostsForModeration(search, isActive, pageable);

        return ResponseEntity.ok(ApiResponse.<Page<PostModerationDto>>builder()
                .success(true)
                .message("Posts retrieved successfully")
                .data(posts)
                .build());
    }

    @PutMapping("/posts/{postId}/status")
    public ResponseEntity<ApiResponse<String>> updatePostStatus(
            @PathVariable Long postId,
            @RequestParam Boolean isActive) {

        adminService.updatePostStatus(postId, isActive);

        return ResponseEntity.ok(ApiResponse.<String>builder()
                .success(true)
                .message("Post status updated successfully")
                .data("Post " + (isActive ? "activated" : "deactivated"))
                .build());
    }

    @DeleteMapping("/posts/{postId}")
    public ResponseEntity<ApiResponse<String>> deletePost(@PathVariable Long postId) {
        log.info("Deleting post ID: {}", postId);

        adminService.deletePost(postId);

        return ResponseEntity.ok(ApiResponse.<String>builder()
                .success(true)
                .message("Post deleted successfully")
                .data("Post deleted")
                .build());
    }

    @PutMapping("/posts/{postId}/pin")
    public ResponseEntity<ApiResponse<String>> updatePostPinStatus(
            @PathVariable Long postId,
            @RequestParam Boolean isPinned) {

        log.info("Updating post ID: {} pin status to: {}", postId, isPinned);

        adminService.updatePostPinStatus(postId, isPinned);

        return ResponseEntity.ok(ApiResponse.<String>builder()
                .success(true)
                .message("Post pin status updated successfully")
                .data("Post " + (isPinned ? "pinned" : "unpinned"))
                .build());
    }

    @PutMapping("/posts/{postId}/hot")
    public ResponseEntity<ApiResponse<String>> updatePostHotStatus(
            @PathVariable Long postId,
            @RequestParam Boolean isHot) {

        log.info("Updating post ID: {} hot status to: {}", postId, isHot);

        adminService.updatePostHotStatus(postId, isHot);

        return ResponseEntity.ok(ApiResponse.<String>builder()
                .success(true)
                .message("Post hot status updated successfully")
                .data("Post " + (isHot ? "marked as hot" : "unmarked as hot"))
                .build());
    }

    @GetMapping("/posts/{postId}")
    public ResponseEntity<ApiResponse<PostModerationDto>> getPostDetails(@PathVariable Long postId) {

        PostModerationDto post = adminService.getPostForModeration(postId);

        return ResponseEntity.ok(ApiResponse.<PostModerationDto>builder()
                .success(true)
                .message("Post details retrieved successfully")
                .data(post)
                .build());
    }

    @GetMapping("/violations")
    public ResponseEntity<ApiResponse<Page<PostModerationDto>>> getViolationPosts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Boolean isActive) {

        Sort sort = Sort.by(sortDir.equalsIgnoreCase("desc") ?
                Sort.Direction.DESC : Sort.Direction.ASC, sortBy);
        Pageable pageable = PageRequest.of(page, size, sort);

        Page<PostModerationDto> violationPosts = adminService.getViolationPosts(search, isActive, pageable);

        return ResponseEntity.ok(ApiResponse.<Page<PostModerationDto>>builder()
                .success(true)
                .message("Violation posts retrieved successfully")
                .data(violationPosts)
                .build());
    }

    @GetMapping("/violations/replies")
    public ResponseEntity<ApiResponse<Page<PostModerationDto>>> getViolationReplies(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Boolean isActive) {

        Sort sort = Sort.by(sortDir.equalsIgnoreCase("desc") ?
                Sort.Direction.DESC : Sort.Direction.ASC, sortBy);
        Pageable pageable = PageRequest.of(page, size, sort);

        Page<PostModerationDto> violationReplies = adminService.getViolationReplies(search, isActive, pageable);

        return ResponseEntity.ok(ApiResponse.<Page<PostModerationDto>>builder()
                .success(true)
                .message("Violation replies retrieved successfully")
                .data(violationReplies)
                .build());
    }

    @PutMapping("/replies/{replyId}/status")
    public ResponseEntity<ApiResponse<String>> updateReplyStatus(
            @PathVariable Long replyId,
            @RequestParam Boolean isActive) {

        adminService.updateReplyStatus(replyId, isActive);

        return ResponseEntity.ok(ApiResponse.<String>builder()
                .success(true)
                .message("Reply status updated successfully")
                .data("Reply " + (isActive ? "activated" : "deactivated"))
                .build());
    }


    @GetMapping("/lawyer-applications")
    public ResponseEntity<ApiResponse<Page<LawyerApplicationDto>>> getLawyerApplications(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String search) {

        Sort sort = Sort.by(sortDir.equalsIgnoreCase("desc") ?
                Sort.Direction.DESC : Sort.Direction.ASC, sortBy);
        Pageable pageable = PageRequest.of(page, size, sort);

        Page<LawyerApplicationDto> applications = adminService.getLawyerApplications(status, search, pageable);

        return ResponseEntity.ok(ApiResponse.<Page<LawyerApplicationDto>>builder()
                .success(true)
                .message("Lawyer applications retrieved successfully")
                .data(applications)
                .build());
    }

    @PutMapping("/lawyer-applications/{applicationId}/approve")
    public ResponseEntity<ApiResponse<String>> approveLawyerApplication(
            @PathVariable Long applicationId,
            @RequestParam(required = false) String adminNotes) {

        adminService.approveLawyerApplication(applicationId, adminNotes);

        return ResponseEntity.ok(ApiResponse.<String>builder()
                .success(true)
                .message("Lawyer application approved successfully")
                .data("Application approved and user role updated to lawyer")
                .build());
    }

    @PutMapping("/lawyer-applications/{applicationId}/reject")
    public ResponseEntity<ApiResponse<String>> rejectLawyerApplication(
            @PathVariable Long applicationId,
            @RequestParam(required = false) String adminNotes) {

        adminService.rejectLawyerApplication(applicationId, adminNotes);

        return ResponseEntity.ok(ApiResponse.<String>builder()
                .success(true)
                .message("Lawyer application rejected successfully")
                .data("Application rejected with admin notes")
                .build());
    }

    @GetMapping("/categories")
    public ResponseEntity<ApiResponse<Page<PostCategoryDto>>> getAllCategoriesForAdmin(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "displayOrder") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDir,
            @RequestParam(required = false) String search) {

        Sort sort = Sort.by(sortDir.equalsIgnoreCase("desc") ?
                Sort.Direction.DESC : Sort.Direction.ASC, sortBy);
        Pageable pageable = PageRequest.of(page, size, sort);

        Page<PostCategoryDto> categories = adminService.getAllCategoriesForAdmin(search, pageable);

        return ResponseEntity.ok(ApiResponse.<Page<PostCategoryDto>>builder()
                .success(true)
                .message("Categories retrieved successfully")
                .data(categories)
                .build());
    }

    @PostMapping("/categories")
    public ResponseEntity<ApiResponse<PostCategoryDto>> createCategory(
            @RequestBody @Valid CategoryCreateDto categoryCreateDto) {

        log.info("Creating new category: {}", categoryCreateDto.getName());

        PostCategoryDto createdCategory = adminService.createCategory(categoryCreateDto);

        return ResponseEntity.ok(ApiResponse.<PostCategoryDto>builder()
                .success(true)
                .message("Category created successfully")
                .data(createdCategory)
                .build());
    }

    @PutMapping("/categories/{categoryId}")
    public ResponseEntity<ApiResponse<PostCategoryDto>> updateCategory(
            @PathVariable Long categoryId,
            @RequestBody @Valid CategoryUpdateDto categoryUpdateDto) {

        log.info("Updating category ID: {} with data: {}", categoryId, categoryUpdateDto.getName());

        PostCategoryDto updatedCategory = adminService.updateCategory(categoryId, categoryUpdateDto);

        return ResponseEntity.ok(ApiResponse.<PostCategoryDto>builder()
                .success(true)
                .message("Category updated successfully")
                .data(updatedCategory)
                .build());
    }

    @DeleteMapping("/categories/{categoryId}")
    public ResponseEntity<ApiResponse<String>> deleteCategory(@PathVariable Long categoryId) {

        log.info("Deleting category ID: {}", categoryId);

        adminService.deleteCategory(categoryId);

        return ResponseEntity.ok(ApiResponse.<String>builder()
                .success(true)
                .message("Category deleted successfully")
                .data("Category and associated posts have been removed")
                .build());
    }

    @PutMapping("/categories/{categoryId}/status")
    public ResponseEntity<ApiResponse<String>> toggleCategoryStatus(
            @PathVariable Long categoryId,
            @RequestParam Boolean isActive) {

        log.info("Toggling category ID: {} status to: {}", categoryId, isActive);

        adminService.updateCategoryStatus(categoryId, isActive);

        return ResponseEntity.ok(ApiResponse.<String>builder()
                .success(true)
                .message("Category status updated successfully")
                .data("Category " + (isActive ? "activated" : "deactivated"))
                .build());
    }

    @GetMapping("/analytics/user-growth")
    public ResponseEntity<ApiResponse<List<UserGrowthData>>> getUserGrowthReport(
            @RequestParam(defaultValue = "30days") String timeRange) {
        log.info("Getting user growth report for timeRange: {}", timeRange);

        try {
            List<UserGrowthData> data = analyticsService.getUserGrowthData(timeRange);
            return ResponseEntity.ok(ApiResponse.<List<UserGrowthData>>builder()
                    .success(true)
                    .message("User growth report generated successfully")
                    .data(data)
                    .build());
        } catch (Exception e) {
            log.error("Error generating user growth report", e);
            return ResponseEntity.ok(ApiResponse.<List<UserGrowthData>>builder()
                    .success(false)
                    .message("An unexpected error occurred")
                    .data(null)
                    .build());
        }
    }

    @GetMapping("/analytics/user-retention")
    public ResponseEntity<ApiResponse<List<UserRetentionData>>> getUserRetentionReport(
            @RequestParam(defaultValue = "30days") String timeRange) {
        log.info("Getting user retention report for timeRange: {}", timeRange);

        try {
            List<UserRetentionData> data = analyticsService.getUserRetentionData(timeRange);
            return ResponseEntity.ok(ApiResponse.<List<UserRetentionData>>builder()
                    .success(true)
                    .message("User retention report generated successfully")
                    .data(data)
                    .build());
        } catch (Exception e) {
            log.error("Error generating user retention report", e);
            return ResponseEntity.ok(ApiResponse.<List<UserRetentionData>>builder()
                    .success(false)
                    .message("An unexpected error occurred")
                    .data(null)
                    .build());
        }
    }

    @GetMapping("/analytics/content-stats")
    public ResponseEntity<ApiResponse<ContentStatsData>> getContentStatsReport(
            @RequestParam(defaultValue = "30days") String timeRange) {
        log.info("Getting content stats report for timeRange: {}", timeRange);

        try {
            ContentStatsData data = analyticsService.getContentStatsData(timeRange);
            return ResponseEntity.ok(ApiResponse.<ContentStatsData>builder()
                    .success(true)
                    .message("Content stats report generated successfully")
                    .data(data)
                    .build());
        } catch (Exception e) {
            log.error("Error generating content stats report", e);
            return ResponseEntity.ok(ApiResponse.<ContentStatsData>builder()
                    .success(false)
                    .message("An unexpected error occurred")
                    .data(null)
                    .build());
        }
    }

    @GetMapping("/analytics/engagement")
    public ResponseEntity<ApiResponse<List<EngagementData>>> getEngagementReport(
            @RequestParam(defaultValue = "30days") String timeRange) {
        log.info("Getting engagement report for timeRange: {}", timeRange);

        try {
            List<EngagementData> data = analyticsService.getEngagementData(timeRange);
            return ResponseEntity.ok(ApiResponse.<List<EngagementData>>builder()
                    .success(true)
                    .message("Engagement report generated successfully")
                    .data(data)
                    .build());
        } catch (Exception e) {
            log.error("Error generating engagement report", e);
            return ResponseEntity.ok(ApiResponse.<List<EngagementData>>builder()
                    .success(false)
                    .message("An unexpected error occurred")
                    .data(null)
                    .build());
        }
    }

    @GetMapping("/analytics/lawyer-performance")
    public ResponseEntity<ApiResponse<List<LawyerPerformanceData>>> getLawyerPerformanceReport(
            @RequestParam(defaultValue = "30days") String timeRange) {
        log.info("Getting lawyer performance report for timeRange: {}", timeRange);

        try {
            List<LawyerPerformanceData> data = analyticsService.getLawyerPerformanceData(timeRange);
            return ResponseEntity.ok(ApiResponse.<List<LawyerPerformanceData>>builder()
                    .success(true)
                    .message("Lawyer performance report generated successfully")
                    .data(data)
                    .build());
        } catch (Exception e) {
            log.error("Error generating lawyer performance report", e);
            return ResponseEntity.ok(ApiResponse.<List<LawyerPerformanceData>>builder()
                    .success(false)
                    .message("An unexpected error occurred")
                    .data(null)
                    .build());
        }
    }

    @GetMapping("/analytics/category-distribution")
    public ResponseEntity<ApiResponse<List<CategoryDistributionData>>> getCategoryDistributionReport(
            @RequestParam(defaultValue = "30days") String timeRange) {
        log.info("Getting category distribution report for timeRange: {}", timeRange);

        try {
            List<CategoryDistributionData> data = analyticsService.getCategoryDistributionData(timeRange);
            return ResponseEntity.ok(ApiResponse.<List<CategoryDistributionData>>builder()
                    .success(true)
                    .message("Category distribution report generated successfully")
                    .data(data)
                    .build());
        } catch (Exception e) {
            log.error("Error generating category distribution report", e);
            return ResponseEntity.ok(ApiResponse.<List<CategoryDistributionData>>builder()
                    .success(false)
                    .message("An unexpected error occurred")
                    .data(null)
                    .build());
        }
    }

    @GetMapping("/analytics/hourly-activity")
    public ResponseEntity<ApiResponse<List<HourlyActivityData>>> getHourlyActivityReport(
            @RequestParam(defaultValue = "30days") String timeRange) {
        log.info("Getting hourly activity report for timeRange: {}", timeRange);

        try {
            List<HourlyActivityData> data = analyticsService.getHourlyActivityData(timeRange);
            return ResponseEntity.ok(ApiResponse.<List<HourlyActivityData>>builder()
                    .success(true)
                    .message("Hourly activity report generated successfully")
                    .data(data)
                    .build());
        } catch (Exception e) {
            log.error("Error generating hourly activity report", e);
            return ResponseEntity.ok(ApiResponse.<List<HourlyActivityData>>builder()
                    .success(false)
                    .message("An unexpected error occurred")
                    .data(null)
                    .build());
        }
    }

    @GetMapping("/analytics/ai")
    public ResponseEntity<ApiResponse<AiStatsData>> getAiReport(
            @RequestParam(defaultValue = "30days") String timeRange) {
        log.info("Getting AI report for timeRange: {}", timeRange);

        try {
            AiStatsData data = analyticsService.getAiStatsData(timeRange);
            return ResponseEntity.ok(ApiResponse.<AiStatsData>builder()
                    .success(true)
                    .message("AI report generated successfully")
                    .data(data)
                    .build());
        } catch (Exception e) {
            log.error("Error generating AI report", e);
            return ResponseEntity.ok(ApiResponse.<AiStatsData>builder()
                    .success(false)
                    .message("An unexpected error occurred")
                    .data(null)
                    .build());
        }
    }

    @GetMapping("/analytics/sentiment")
    public ResponseEntity<ApiResponse<SentimentData>> getSentimentReport(
            @RequestParam(defaultValue = "30days") String timeRange) {
        log.info("Getting sentiment report for timeRange: {}", timeRange);

        try {
            SentimentData data = analyticsService.getSentimentData(timeRange);
            return ResponseEntity.ok(ApiResponse.<SentimentData>builder()
                    .success(true)
                    .message("Sentiment report generated successfully")
                    .data(data)
                    .build());
        } catch (Exception e) {
            log.error("Error generating sentiment report", e);
            return ResponseEntity.ok(ApiResponse.<SentimentData>builder()
                    .success(false)
                    .message("An unexpected error occurred")
                    .data(null)
                    .build());
        }
    }

    @GetMapping("/analytics/{reportType}/export")
    public ResponseEntity<?> exportReport(
            @PathVariable String reportType,
            @RequestParam(defaultValue = "30days") String timeRange,
            @RequestParam(defaultValue = "pdf") String format) {
        log.info("Exporting {} report as {} for timeRange: {}", reportType, format, timeRange);

        try {
            byte[] reportBytes = analyticsService.exportReport(reportType, timeRange, format);

            String filename = String.format("%s-report-%s.%s", reportType, timeRange, format);
            String contentType = switch (format.toLowerCase()) {
                case "pdf" -> "application/pdf";
                case "excel" -> "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
                case "csv" -> "text/csv";
                default -> "application/octet-stream";
            };

            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(contentType))
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                    .body(reportBytes);
        } catch (UnsupportedOperationException e) {
            log.warn("Export functionality not yet implemented");
            return ResponseEntity.ok(ApiResponse.<String>builder()
                    .success(false)
                    .message("Export functionality is not yet implemented")
                    .data(null)
                    .build());
        } catch (Exception e) {
            log.error("Error exporting report", e);
            return ResponseEntity.ok(ApiResponse.<String>builder()
                    .success(false)
                    .message("An error occurred while exporting the report")
                    .data(null)
                    .build());
        }
    }
}