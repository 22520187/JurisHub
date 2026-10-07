package com.example.jurisHub.service.impl;

import com.example.jurisHub.dto.admin.*;
import com.example.jurisHub.dto.forum.PostCategoryDto;
import com.example.jurisHub.entity.*;
import com.example.jurisHub.mapper.PostCategoryMapper;
import com.example.jurisHub.repository.*;
import com.example.jurisHub.security.UserPrincipal;
import com.example.jurisHub.service.AdminService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AdminServiceImpl implements AdminService {

    private final UserRepository userRepository;
    private final ForumRepository forumRepository;
    private final PostCategoryRepository postCategoryRepository;
    private final LawyerApplicationRepository lawyerApplicationRepository;
    private final PostCategoryMapper postCategoryMapper;
    private final PostReportRepository postReportRepository;
    private final PostReplyRepository postReplyRepository;

    @Override
    @PreAuthorize("hasRole('ADMIN')")
    public Page<UserManagementDto> getAllUsers(String search, String role, Pageable pageable) {
        Page<User> users;
        if (search != null && !search.trim().isEmpty()) {
            users = userRepository.findByFullNameContainingIgnoreCaseOrEmailContainingIgnoreCase(
                    search.trim(), search.trim(), pageable);
        } else if (role != null && !role.trim().isEmpty()) {
            try {
                User.Role userRole = User.Role.valueOf(role.toUpperCase());
                users = userRepository.findByRole(userRole, pageable);
            } catch (IllegalArgumentException e) {
                users = userRepository.findAll(pageable);
            }
        } else {
            users = userRepository.findAll(pageable);
        }

        return users.map(this::convertToUserManagementDto);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @Override
    public Page<PostModerationDto> getPostsForModeration(String search, Boolean isActive, Pageable pageable) {
        Page<Post> posts;

        if (search != null && !search.trim().isEmpty()) {
            posts = forumRepository.findByTitleContainingIgnoreCaseOrContentContainingIgnoreCase(
                    search.trim(), search.trim(), pageable);
        } else if (isActive != null) {
            posts = forumRepository.findByIsActive(isActive, pageable);
        } else {
            posts = forumRepository.findAll(pageable);
        }

        return posts.map(this::convertToPostModerationDto);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @Override
    public Page<PostModerationDto> getViolationPosts(String search, Boolean isActive, Pageable pageable) {
        Page<Post> posts;

        if (search != null && !search.trim().isEmpty()) {
            if (isActive != null) {
                posts = forumRepository.findReportedPostsBySearchTermAndStatus(
                        0, isActive, search.trim(), pageable);
            } else {
                posts = forumRepository.findReportedPostsBySearchTerm(
                        0, search.trim(), pageable);
            }
        } else {
            if (isActive != null) {
                posts = forumRepository.findByReportCountGreaterThanAndIsActive(0, isActive, pageable);
            } else {
                posts = forumRepository.findByReportCountGreaterThan(0, pageable);
            }
        }

        return posts.map(this::convertToPostModerationDto);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @Override
    public Page<PostModerationDto> getViolationReplies(String search, Boolean isActive, Pageable pageable) {
        Page<PostReply> replies;

        if (search != null && !search.trim().isEmpty() || isActive != null) {
            replies = postReplyRepository.findBySentimentLabelAndFilters("negative", isActive, search, pageable);
        } else {
            replies = postReplyRepository.findBySentimentLabel("negative", pageable);
        }

        return replies.map(reply -> convertToPostModerationDto(reply));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @Override
    @Transactional
    public void updateReplyStatus(Long replyId, Boolean isActive) {
        PostReply reply = postReplyRepository.findById(replyId)
                .orElseThrow(() -> new RuntimeException("Reply not found"));

        reply.setIsActive(isActive);
        postReplyRepository.save(reply);

        log.info("Reply {} status updated to: {}", replyId, isActive ? "active" : "inactive");
    }

    @PreAuthorize("hasRole('ADMIN')")
    @Override
    public Page<LawyerApplicationDto> getLawyerApplications(String status, String search, Pageable pageable) {
        LawyerApplication.ApplicationStatus appStatus = null;

        if (status != null && !status.trim().isEmpty()) {
            try {
                appStatus = LawyerApplication.ApplicationStatus.valueOf(status.toUpperCase());
            } catch (IllegalArgumentException e) {
                log.warn("Invalid status provided: {}", status);
            }
        }

        Page<LawyerApplication> applications = lawyerApplicationRepository.findByStatusAndSearch(
                appStatus, search != null ? search.trim() : "", pageable);

        return applications.map(this::convertToLawyerApplicationDto);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @Override
    @Transactional
    public void updateUserStatus(Long userId, Boolean isEnabled) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.setIsEnabled(isEnabled);
        userRepository.save(user);

        log.info("User {} status updated to: {}", userId, isEnabled ? "enabled" : "disabled");
    }

    @PreAuthorize("hasRole('ADMIN')")
    @Override
    @Transactional
    public void updatePostStatus(Long postId, Boolean isActive) {
        Post post = forumRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found"));

        post.setIsActive(isActive);
        forumRepository.save(post);

        log.info("Post {} status updated to: {}", postId, isActive ? "active" : "inactive");
    }

    @PreAuthorize("hasRole('ADMIN')")
    @Override
    @Transactional
    public void approveLawyerApplication(Long applicationId, String adminNotes) {
        LawyerApplication application = lawyerApplicationRepository.findById(applicationId)
                .orElseThrow(() -> new RuntimeException("Application not found"));

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        UserPrincipal userPrincipal = (UserPrincipal) auth.getPrincipal();

        application.setStatus(LawyerApplication.ApplicationStatus.APPROVED);
        application.setAdminNotes(adminNotes);
        application.setReviewedBy(userPrincipal.getId());
        application.setReviewedAt(LocalDateTime.now());

        User user = application.getUser();
        user.setRole(User.Role.LAWYER);

        lawyerApplicationRepository.save(application);
        userRepository.save(user);

        log.info("Lawyer application {} approved by admin {}", applicationId, userPrincipal.getId());
    }

    @PreAuthorize("hasRole('ADMIN')")
    @Override
    @Transactional
    public void rejectLawyerApplication(Long applicationId, String adminNotes) {
        LawyerApplication application = lawyerApplicationRepository.findById(applicationId)
                .orElseThrow(() -> new RuntimeException("Application not found"));

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        UserPrincipal userPrincipal = (UserPrincipal) auth.getPrincipal();

        application.setStatus(LawyerApplication.ApplicationStatus.REJECTED);
        application.setAdminNotes(adminNotes);
        application.setReviewedBy(userPrincipal.getId());
        application.setReviewedAt(LocalDateTime.now());

        lawyerApplicationRepository.save(application);

        log.info("Lawyer application {} rejected by admin {}", applicationId, userPrincipal.getId());
    }

    @PreAuthorize("hasRole('ADMIN')")
    @Override
    public AdminDashboardStatsDto getDashboardStatistics() {
        log.info("Generating admin dashboard statistics");

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime thirtyDaysAgo = now.minus(30, ChronoUnit.DAYS);
        LocalDateTime startOfMonth = now.withDayOfMonth(1).withHour(0).withMinute(0).withSecond(0);

        long totalUsers = userRepository.count();
        long totalPosts = forumRepository.count();
        long totalLawyers = userRepository.countByRole(User.Role.LAWYER);
        long totalCategories = forumRepository.countDistinctCategories();

        long pendingApplications = lawyerApplicationRepository.countByStatus(LawyerApplication.ApplicationStatus.PENDING);
        long activeUsers = userRepository.count(); // Temporarily use total count instead of lastLogin
        long reportedPosts = forumRepository.countByIsReportedTrue();

        long newUsersThisMonth = userRepository.countByCreatedAtAfter(startOfMonth);
        long newPostsThisMonth = forumRepository.countByCreatedAtAfter(startOfMonth);
        long newLawyersThisMonth = lawyerApplicationRepository.countByStatusAndReviewedAtAfter(
                LawyerApplication.ApplicationStatus.APPROVED, startOfMonth);

        List<AdminDashboardStatsDto.UserRoleStatsDto> usersByRole = new ArrayList<>();
        for (User.Role role : User.Role.values()) {
            long count = userRepository.countByRole(role);
            long activeCount = count; // Temporarily use same count instead of lastLogin

            usersByRole.add(AdminDashboardStatsDto.UserRoleStatsDto.builder()
                    .role(role.toString())
                    .count(count)
                    .activeCount(activeCount)
                    .build());
        }

        List<Post> popularPostsEntities = forumRepository.findTopPostsByViews(thirtyDaysAgo, 5);
        List<AdminDashboardStatsDto.PopularContentDto> popularPosts = popularPostsEntities.stream()
                .map(post -> AdminDashboardStatsDto.PopularContentDto.builder()
                        .postId(post.getId())
                        .title(post.getTitle())
                        .categoryName(post.getCategory().getName())
                        .views(post.getViews())
                        .replies(post.getReplyCount())
                        .createdAt(post.getCreatedAt())
                        .build())
                .collect(Collectors.toList());

        List<AdminDashboardStatsDto.RecentActivityDto> recentActivities = new ArrayList<>();

        List<User> recentUsers = userRepository.findTop5ByOrderByCreatedAtDesc();
        for (User user : recentUsers) {
            recentActivities.add(AdminDashboardStatsDto.RecentActivityDto.builder()
                    .type("USER_REGISTERED")
                    .description("New user registered: " + user.getFullName())
                    .timestamp(user.getCreatedAt())
                    .userEmail(user.getEmail())
                    .entityId(user.getId())
                    .build());
        }

        List<Post> recentPosts = forumRepository.findTop5ByOrderByCreatedAtDesc();
        for (Post post : recentPosts) {
            recentActivities.add(AdminDashboardStatsDto.RecentActivityDto.builder()
                    .type("POST_CREATED")
                    .description("New post: " + post.getTitle())
                    .timestamp(post.getCreatedAt())
                    .userEmail(post.getAuthor().getEmail())
                    .entityId(post.getId())
                    .build());
        }

        recentActivities = recentActivities.stream()
                .sorted((a, b) -> b.getTimestamp().compareTo(a.getTimestamp()))
                .limit(10)
                .collect(Collectors.toList());

        List<AdminDashboardStatsDto.MonthlyGrowthDto> monthlyGrowth = generateMonthlyGrowthData();

        List<AdminDashboardStatsDto.WeeklyActivityDto> weeklyActivity = generateWeeklyActivityData();

        return AdminDashboardStatsDto.builder()
                .totalUsers(totalUsers)
                .totalPosts(totalPosts)
                .totalLawyers(totalLawyers)
                .totalCategories(totalCategories)
                .pendingApplications(pendingApplications)
                .activeUsers(activeUsers)
                .reportedPosts(reportedPosts)
                .unresolvedReports(reportedPosts) // Assuming all reported posts are unresolved for now
                .newUsersThisMonth(newUsersThisMonth)
                .newPostsThisMonth(newPostsThisMonth)
                .newLawyersThisMonth(newLawyersThisMonth)
                .totalMessages(0L) // TODO: Implement when message system is ready
                .totalConversations(0L) // TODO: Implement when message system is ready
                .recentActivities(recentActivities)
                .popularPosts(popularPosts)
                .usersByRole(usersByRole)
                .monthlyGrowth(monthlyGrowth)
                .weeklyActivity(weeklyActivity)
                .lastUpdated(now)
                .build();
    }

    private List<AdminDashboardStatsDto.MonthlyGrowthDto> generateMonthlyGrowthData() {
        List<AdminDashboardStatsDto.MonthlyGrowthDto> monthlyData = new ArrayList<>();
        LocalDateTime now = LocalDateTime.now();

        for (int i = 5; i >= 0; i--) {
            LocalDateTime monthStart = now.minusMonths(i).withDayOfMonth(1).withHour(0).withMinute(0).withSecond(0);
            LocalDateTime monthEnd = monthStart.plusMonths(1).minusSeconds(1);

            String monthLabel = monthStart.format(java.time.format.DateTimeFormatter.ofPattern("MM/yyyy"));

            long users = userRepository.countByCreatedAtBetween(monthStart, monthEnd);
            long lawyers = userRepository.countByRoleAndCreatedAtBetween(User.Role.LAWYER, monthStart, monthEnd);
            long posts = forumRepository.countByCreatedAtBetween(monthStart, monthEnd);

            monthlyData.add(AdminDashboardStatsDto.MonthlyGrowthDto.builder()
                    .month(monthLabel)
                    .users(users)
                    .lawyers(lawyers)
                    .posts(posts)
                    .build());
        }

        return monthlyData;
    }

    private List<AdminDashboardStatsDto.WeeklyActivityDto> generateWeeklyActivityData() {
        List<AdminDashboardStatsDto.WeeklyActivityDto> weeklyData = new ArrayList<>();
        LocalDateTime now = LocalDateTime.now();

        LocalDateTime monday = now.with(java.time.DayOfWeek.MONDAY);

        if (now.isBefore(monday)) {
            monday = monday.minusWeeks(1);
        }

        String[] dayNames = {"Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "Chủ nhật"};

        for (int i = 0; i < 7; i++) {
            LocalDateTime dayStart = monday.plusDays(i).withHour(0).withMinute(0).withSecond(0);
            LocalDateTime dayEnd = dayStart.plusDays(1).minusSeconds(1);

            long posts = forumRepository.countByCreatedAtBetween(dayStart, dayEnd);
            long replies = 0; // TODO: Implement reply counting when PostReply entity is ready
            long views = posts * 25; // Rough estimate: 25 views per post

            weeklyData.add(AdminDashboardStatsDto.WeeklyActivityDto.builder()
                    .day(dayNames[i])
                    .posts(posts)
                    .replies(replies)
                    .views(views)
                    .build());
        }

        return weeklyData;
    }

    @PreAuthorize("hasRole('ADMIN')")
    @Override
    public Page<PostCategoryDto> getAllCategoriesForAdmin(String search, Pageable pageable) {
        Page<PostCategory> categories;

        if (search != null && !search.trim().isEmpty()) {
            categories = postCategoryRepository.findAll(pageable);
        } else {
            categories = postCategoryRepository.findAll(pageable);
        }

        return categories.map(postCategoryMapper::toDto);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @Override
    @Transactional
    public PostCategoryDto createCategory(CategoryCreateDto categoryCreateDto) {
        log.info("Creating category: {}", categoryCreateDto.getName());

        if (postCategoryRepository.existsBySlug(categoryCreateDto.getSlug())) {
            throw new IllegalArgumentException("Category slug already exists: " + categoryCreateDto.getSlug());
        }

        if (postCategoryRepository.findByNameIgnoreCase(categoryCreateDto.getName()).isPresent()) {
            throw new IllegalArgumentException("Category name already exists: " + categoryCreateDto.getName());
        }

        PostCategory category = new PostCategory();
        category.setName(categoryCreateDto.getName());
        category.setSlug(categoryCreateDto.getSlug());
        category.setDescription(categoryCreateDto.getDescription());
        category.setIcon(categoryCreateDto.getIcon());
        category.setDisplayOrder(categoryCreateDto.getDisplayOrder() != null ? categoryCreateDto.getDisplayOrder() : 0);
        category.setIsActive(categoryCreateDto.getIsActive() != null ? categoryCreateDto.getIsActive() : true);

        PostCategory savedCategory = postCategoryRepository.save(category);

        log.info("Category created successfully with ID: {}", savedCategory.getId());
        return postCategoryMapper.toDto(savedCategory);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @Override
    @Transactional
    public PostCategoryDto updateCategory(Long categoryId, CategoryUpdateDto categoryUpdateDto) {
        log.info("Updating category ID: {}", categoryId);

        PostCategory existingCategory = postCategoryRepository.findById(categoryId)
                .orElseThrow(() -> new RuntimeException("Category not found with ID: " + categoryId));

        if (postCategoryRepository.existsBySlugAndIdNot(categoryUpdateDto.getSlug(), categoryId)) {
            throw new IllegalArgumentException("Category slug already exists: " + categoryUpdateDto.getSlug());
        }

        existingCategory.setName(categoryUpdateDto.getName());
        existingCategory.setSlug(categoryUpdateDto.getSlug());
        existingCategory.setDescription(categoryUpdateDto.getDescription());
        existingCategory.setIcon(categoryUpdateDto.getIcon());
        existingCategory.setDisplayOrder(categoryUpdateDto.getDisplayOrder() != null ? categoryUpdateDto.getDisplayOrder() : 0);
        existingCategory.setIsActive(categoryUpdateDto.getIsActive() != null ? categoryUpdateDto.getIsActive() : true);

        PostCategory updatedCategory = postCategoryRepository.save(existingCategory);

        log.info("Category updated successfully: {}", updatedCategory.getName());
        return postCategoryMapper.toDto(updatedCategory);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @Override
    @Transactional
    public void deleteCategory(Long categoryId) {
        log.info("Deleting category ID: {}", categoryId);

        PostCategory category = postCategoryRepository.findById(categoryId)
                .orElseThrow(() -> new RuntimeException("Category not found with ID: " + categoryId));

        if (category.getPosts() != null && !category.getPosts().isEmpty()) {
            log.warn("Category ID: {} has {} associated posts. Deactivating instead of deleting.",
                    categoryId, category.getPosts().size());

            category.setIsActive(false);
            postCategoryRepository.save(category);
        } else {
            postCategoryRepository.delete(category);
            log.info("Category deleted successfully: {}", category.getName());
        }
    }

    @PreAuthorize("hasRole('ADMIN')")
    @Override
    @Transactional
    public void updateCategoryStatus(Long categoryId, Boolean isActive) {
        log.info("Updating category ID: {} status to: {}", categoryId, isActive);

        PostCategory category = postCategoryRepository.findById(categoryId)
                .orElseThrow(() -> new RuntimeException("Category not found with ID: " + categoryId));

        category.setIsActive(isActive);
        postCategoryRepository.save(category);

        log.info("Category status updated successfully: {} -> {}", category.getName(), isActive);
    }


    @PreAuthorize("hasRole('ADMIN')")
    @Override
    @Transactional
    public void deletePost(Long postId) {
        log.info("Deleting post ID: {}", postId);

        Post post = forumRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found with ID: " + postId));

        forumRepository.delete(post);

        log.info("Post deleted successfully: {}", post.getTitle());
    }

    @PreAuthorize("hasRole('ADMIN')")
    @Override
    @Transactional
    public void updatePostPinStatus(Long postId, Boolean isPinned) {
        log.info("Updating post ID: {} pin status to: {}", postId, isPinned);

        Post post = forumRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found with ID: " + postId));

        post.setPinned(isPinned);
        forumRepository.save(post);

        log.info("Post pin status updated successfully: {} -> {}", post.getTitle(), isPinned);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @Override
    @Transactional
    public void updatePostHotStatus(Long postId, Boolean isHot) {
        log.info("Updating post ID: {} hot status to: {}", postId, isHot);

        Post post = forumRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found with ID: " + postId));

        post.setIsHot(isHot);
        forumRepository.save(post);

        log.info("Post hot status updated successfully: {} -> {}", post.getTitle(), isHot);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @Override
    public PostModerationDto getPostForModeration(Long postId) {
        log.info("Getting post ID: {} for moderation", postId);

        Post post = forumRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found with ID: " + postId));

        return mapToPostModerationDto(post);
    }

    private PostModerationDto mapToPostModerationDto(Post post) {
        return PostModerationDto.builder()
                .id(post.getId())
                .title(post.getTitle())
                .content(post.getContent())
                .categoryName(post.getCategory() != null ? post.getCategory().getName() : "Unknown")
                .author(PostModerationDto.AuthorDto.builder()
                        .id(post.getAuthor().getId())
                        .fullName(post.getAuthor().getFullName())
                        .email(post.getAuthor().getEmail())
                        .avatar(post.getAuthor().getAvatar())
                        .role(post.getAuthor().getRole().toString())
                        .build())
                .views(post.getViews())
                .replyCount(post.getReplies() != null ? post.getReplies().size() : 0)
                .isActive(post.getIsActive())
                .isPinned(post.getPinned())
                .isHot(post.getIsHot())
                .createdAt(post.getCreatedAt())
                .updatedAt(post.getUpdatedAt())
                .violationReason(null) // TODO: Add violation reason field to Post entity if needed
                .isReported(false) // TODO: Implement reporting system
                .reportCount(0) // TODO: Implement reporting system
                .build();
    }

    private UserManagementDto convertToUserManagementDto(User user) {
        return UserManagementDto.builder()
                .id(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .phoneNumber(user.getPhoneNumber())
                .avatar(user.getAvatar())
                .role(user.getRole().toString())
                .authProvider(user.getAuthProvider().toString())
                .isEmailVerified(user.getIsEmailVerified())
                .isEnabled(user.getIsEnabled())
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .postsCount(0) // TODO: implement count
                .messagesCount(0) // TODO: implement count
                .build();
    }

    private PostModerationDto convertToPostModerationDto(Post post) {
        PostModerationDto.AuthorDto authorDto;
        if (post.getAuthor() == null) {
            authorDto = PostModerationDto.AuthorDto.builder()
                    .id(0L)
                    .fullName("Unknown")
                    .email("unknown@example.com")
                    .role("USER")
                    .build();
        } else {
            authorDto = PostModerationDto.AuthorDto.builder()
                    .id(post.getAuthor().getId())
                    .fullName(post.getAuthor().getFullName())
                    .email(post.getAuthor().getEmail())
                    .avatar(post.getAuthor().getAvatar())
                    .role(post.getAuthor().getRole().toString())
                    .build();
        }

        List<String> reportReasons = postReportRepository.findByPostIdOrderByCreatedAtDesc(post.getId())
                .stream()
                .map(PostReport::getReason)
                .distinct()
                .collect(java.util.stream.Collectors.toList());

        return PostModerationDto.builder()
                .id(post.getId())
                .title(post.getTitle())
                .content(post.getContent())
                .categoryName(post.getCategory() != null ? post.getCategory().getName() : "Không có danh mục")
                .author(authorDto)
                .views(post.getViews())
                .replyCount(post.getReplyCount())
                .isActive(post.getIsActive())
                .isPinned(post.getPinned())
                .isHot(post.getIsHot())
                .createdAt(post.getCreatedAt())
                .updatedAt(post.getUpdatedAt())
                .violationReason(post.getViolationReason())
                .isReported(post.getIsReported() != null ? post.getIsReported() : false)
                .reportCount(post.getReportCount() != null ? post.getReportCount() : 0)
                .reportReasons(reportReasons)
                .build();
    }

    private PostModerationDto convertToPostModerationDto(PostReply reply) {
        PostModerationDto.AuthorDto authorDto;
        if (reply.getAuthor() == null) {
            authorDto = PostModerationDto.AuthorDto.builder()
                    .id(0L)
                    .fullName("Unknown")
                    .email("unknown@example.com")
                    .role("USER")
                    .build();
        } else {
            authorDto = PostModerationDto.AuthorDto.builder()
                    .id(reply.getAuthor().getId())
                    .fullName(reply.getAuthor().getFullName())
                    .email(reply.getAuthor().getEmail())
                    .avatar(reply.getAuthor().getAvatar())
                    .role(reply.getAuthor().getRole().toString())
                    .build();
        }

        return PostModerationDto.builder()
                .id(reply.getId())
                .title(reply.getPost() != null ? "Bình luận trong: " + reply.getPost().getTitle() : "Bình luận (Bài viết đã xóa)")
                .content(reply.getContent())
                .categoryName(reply.getPost() != null && reply.getPost().getCategory() != null ? reply.getPost().getCategory().getName() : "Không có danh mục")
                .author(authorDto)
                .views(0)
                .replyCount(0)
                .isActive(reply.getIsActive())
                .isPinned(false)
                .isHot(false)
                .createdAt(reply.getCreatedAt())
                .updatedAt(reply.getUpdatedAt())
                .violationReason(null)
                .isReported(true)
                .reportCount(1)
                .reportReasons(Collections.singletonList("AI: Nội dung tiêu cực (" + reply.getSentimentLabel() + ")"))
                .build();
    }

    private LawyerApplicationDto convertToLawyerApplicationDto(LawyerApplication application) {
        LawyerApplicationDto.UserSummaryDto userDto = LawyerApplicationDto.UserSummaryDto.builder()
                .id(application.getUser().getId())
                .fullName(application.getUser().getFullName())
                .email(application.getUser().getEmail())
                .avatar(application.getUser().getAvatar())
                .build();

        return LawyerApplicationDto.builder()
                .id(application.getId())
                .user(userDto)
                .licenseNumber(application.getLicenseNumber())
                .lawSchool(application.getLawSchool())
                .graduationYear(application.getGraduationYear())
                .specializations(application.getSpecializations() != null ?
                        Arrays.asList(application.getSpecializations().split(",")) : null)
                .yearsOfExperience(application.getYearsOfExperience())
                .currentFirm(application.getCurrentFirm())
                .bio(application.getBio())
                .phoneNumber(application.getPhoneNumber())
                .officeAddress(application.getOfficeAddress())
                .documentUrls(application.getDocumentUrls())
                .status(application.getStatus().toString())
                .adminNotes(application.getAdminNotes())
                .reviewedBy(application.getReviewedBy())
                .reviewedAt(application.getReviewedAt())
                .createdAt(application.getCreatedAt())
                .build();
    }
}
