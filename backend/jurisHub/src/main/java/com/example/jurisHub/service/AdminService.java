package com.example.jurisHub.service;

import com.example.jurisHub.dto.admin.*;
import com.example.jurisHub.dto.forum.PostCategoryDto;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface AdminService {
    Page<UserManagementDto> getAllUsers(String search, String role, Pageable pageable);

    Page<PostModerationDto> getPostsForModeration(String search, Boolean isActive, Pageable pageable);

    Page<PostModerationDto> getViolationPosts(String search, Boolean isActive, Pageable pageable);

    Page<PostModerationDto> getViolationReplies(String search, Boolean isActive, Pageable pageable);

    void updateReplyStatus(Long replyId, Boolean isActive);

    Page<LawyerApplicationDto> getLawyerApplications(String status, String search, Pageable pageable);

    void updateUserStatus(Long userId, Boolean isEnabled);

    void updatePostStatus(Long postId, Boolean isActive);

    void approveLawyerApplication(Long applicationId, String adminNotes);

    void rejectLawyerApplication(Long applicationId, String adminNotes);

    AdminDashboardStatsDto getDashboardStatistics();

    Page<PostCategoryDto> getAllCategoriesForAdmin(String search, Pageable pageable);

    PostCategoryDto createCategory(CategoryCreateDto categoryCreateDto);

    PostCategoryDto updateCategory(Long categoryId, CategoryUpdateDto categoryUpdateDto);

    void deleteCategory(Long categoryId);

    void updateCategoryStatus(Long categoryId, Boolean isActive);

    void deletePost(Long postId);

    void updatePostPinStatus(Long postId, Boolean isPinned);

    void updatePostHotStatus(Long postId, Boolean isHot);

    PostModerationDto getPostForModeration(Long postId);


}
