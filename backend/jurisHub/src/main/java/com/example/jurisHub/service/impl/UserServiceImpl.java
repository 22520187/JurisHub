package com.example.jurisHub.service.impl;

import com.example.jurisHub.dto.auth.RegisterRequest;
import com.example.jurisHub.dto.user.UpdateProfileRequest;
import com.example.jurisHub.dto.user.UserPostDto;
import com.example.jurisHub.dto.user.UserProfileDto;
import com.example.jurisHub.entity.Post;
import com.example.jurisHub.entity.User;
import com.example.jurisHub.mapper.UserMapper;
import com.example.jurisHub.repository.ForumRepository;
import com.example.jurisHub.repository.PostReplyRepository;
import com.example.jurisHub.repository.UserRepository;
import com.example.jurisHub.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional
public class UserServiceImpl implements UserService {
    private final UserRepository userRepository;
    private final ForumRepository forumRepository;
    private final PostReplyRepository postReplyRepository;
    private final PasswordEncoder passwordEncoder;
    private final UserMapper userMapper;

    @Override
    public User createUser(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email is already in use");
        }

        User user = userMapper.toEntity(request);
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        return userRepository.save(user);
    }

    @Override
    public Optional<User> findByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    @Override
    public User findOrCreateOAuth2User(String email, String name, String providerId, String picture) {
        Optional<User> existingUser = userRepository.findByEmail(email);

        if (existingUser.isPresent()) {
            User user = existingUser.get();
            userMapper.updateUserFromOAuth2(user, name, providerId, picture);
            return userRepository.save(user);
        }

        User newUser = userMapper.createOAuth2User(email, name, providerId, picture);
        newUser.setPassword(passwordEncoder.encode("oauth2-user-" + System.currentTimeMillis()));

        return userRepository.save(newUser);
    }

    @Override
    @Transactional
    public UserProfileDto getUserProfile(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found "));

        long postCount = forumRepository.countByAuthorAndIsActiveTrue(user);
        long replyCount = postReplyRepository.countByAuthorAndIsActiveTrue(user);

        List<String> legalExpertiseList = new ArrayList<>();

        if (user.getLegalExpertise() != null && !user.getLegalExpertise().isEmpty()) {
            legalExpertiseList = Arrays.asList(user.getLegalExpertise().split(","));
        }

        return UserProfileDto.builder()
                .id(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .avatar(user.getAvatar())
                .role(user.getRole().name())
                .phoneNumber(user.getPhoneNumber())
                .postCount(postCount)
                .replyCount(replyCount)
                .joinedAt(user.getCreatedAt())
                .bio(user.getBio())
                .legalExpertise(legalExpertiseList)
                .build();
    }

    @Override
    @Transactional
    public UserProfileDto updateProfile(Long userId, UpdateProfileRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (request.getFullName() != null && !request.getFullName().trim().isEmpty()) {
            user.setFullName(request.getFullName().trim());
        }
        if (request.getPhoneNumber() != null) {
            user.setPhoneNumber(request.getPhoneNumber().trim());
        }
        if (request.getBio() != null) {
            user.setBio(request.getBio());
        }
        if (request.getAvatar() != null) {
            user.setAvatar(request.getAvatar());
        }
        if (request.getLegalExpertise() != null) {
            user.setLegalExpertise(String.join(",", request.getLegalExpertise()));
        }

        userRepository.save(user);
        return getUserProfile(userId);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<UserPostDto> getUserPosts(Long userId, Pageable pageable) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        org.springframework.data.domain.Page<Post> posts = forumRepository.findByAuthorAndIsActiveTrueOrderByCreatedAtDesc(user, pageable);

        return posts.map(post -> UserPostDto.builder()
                .id(post.getId())
                .title(post.getTitle())
                .content(post.getContent())
                .categoryName(post.getCategory().getName())
                .categorySlug(post.getCategory().getSlug())
                .views(post.getViews())
                .replyCount(post.getReplyCount())
                .pinned(post.getPinned())
                .solved(post.getSolved())
                .isHot(post.getIsHot())
                .createdAt(post.getCreatedAt())
                .updatedAt(post.getUpdatedAt())
                .build());
    }
}
