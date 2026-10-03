package com.example.jurisHub.service;

import com.example.jurisHub.dto.auth.RegisterRequest;
import com.example.jurisHub.dto.user.UpdateProfileRequest;
import com.example.jurisHub.dto.user.UserPostDto;
import com.example.jurisHub.dto.user.UserProfileDto;
import com.example.jurisHub.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.Optional;

public interface UserService {
    User createUser(RegisterRequest request);

    Optional<User> findByEmail(String email);

    User findOrCreateOAuth2User(String email, String name, String providerId, String picture);

    UserProfileDto getUserProfile(Long userId);

    UserProfileDto updateProfile(Long userId, UpdateProfileRequest request);

    Page<UserPostDto> getUserPosts(Long userId, Pageable pageable);
}

