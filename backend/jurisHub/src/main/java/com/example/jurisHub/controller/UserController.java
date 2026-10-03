package com.example.jurisHub.controller;

import com.example.jurisHub.dto.common.ApiResponse;
import com.example.jurisHub.dto.user.UpdateProfileRequest;
import com.example.jurisHub.dto.user.UserPostDto;
import com.example.jurisHub.dto.user.UserProfileDto;
import com.example.jurisHub.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@Slf4j
public class UserController {
    private final UserService userService;

    @GetMapping("/{userId}")
    public ResponseEntity<ApiResponse<UserProfileDto>> getUserProfile(@PathVariable Long userId) {
        UserProfileDto userProfile = userService.getUserProfile(userId);
        return ResponseEntity.ok(ApiResponse.<UserProfileDto>builder()
                .success(true)
                .message("User profile retrieved successfully")
                .data(userProfile)
                .build());
    }

    @PutMapping("/{userId}")
    public ResponseEntity<ApiResponse<UserProfileDto>> updateUserProfile(
            @PathVariable Long userId,
            @Valid @RequestBody UpdateProfileRequest request) {
        UserProfileDto userProfile = userService.updateProfile(userId, request);
        return ResponseEntity.ok(ApiResponse.<UserProfileDto>builder()
                .success(true)
                .message("User profile updated successfully")
                .data(userProfile)
                .build());
    }

    @GetMapping("/{userId}/posts")
    public ResponseEntity<ApiResponse<Page<UserPostDto>>> getUserPosts(
            @PathVariable Long userId,
            @PageableDefault(size = 20, sort = "createdAt") Pageable pageable) {
        try {
            Page<UserPostDto> posts = userService.getUserPosts(userId, pageable);
            return ResponseEntity.ok(ApiResponse.<Page<UserPostDto>>builder()
                    .success(true)
                    .message("User posts retrieved successfully")
                    .data(posts)
                    .build());
        } catch (RuntimeException e) {
            log.error("Error getting user posts: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(ApiResponse.<Page<UserPostDto>>builder()
                            .success(false)
                            .message(e.getMessage())
                            .build());
        }
    }
}
