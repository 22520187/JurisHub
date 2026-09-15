package com.example.jurisHub.mapper;

import com.example.jurisHub.dto.auth.AuthResponse;
import com.example.jurisHub.dto.auth.RegisterRequest;
import com.example.jurisHub.entity.User;
import org.springframework.stereotype.Component;

@Component
public class UserMapper {
    public User toEntity(RegisterRequest registerRequest) {
        if (registerRequest == null) {
            return null;
        }

        return User.builder()
                .email(registerRequest.getEmail())
                .password(registerRequest.getPassword())
                .fullName(registerRequest.getFullName())
                .phoneNumber(registerRequest.getPhoneNumber())
                .role(User.Role.USER)
                .authProvider(User.AuthProvider.LOCAL)
                .isEmailVerified(false)
                .isEnabled(true)
                .build();
    }

    public AuthResponse toAuthResponse(User user) {
        if (user == null) {
            return null;
        }

        return AuthResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .phoneNumber(user.getPhoneNumber())
                .avatar(user.getAvatar())
                .role(user.getRole())
                .authProvider(user.getAuthProvider())
                .build();
    }

    public User createOAuth2User(String email, String name, String providerId, String picture) {
        return User.builder()
                .email(email)
                .fullName(name)
                .role(User.Role.USER)
                .authProvider(User.AuthProvider.GOOGLE)
                .providerId(providerId)
                .avatar(picture)
                .isEmailVerified(true)
                .isEnabled(true)
                .build();
    }

    public void updateUserFromOAuth2(User existingUser, String name, String providerId, String picture) {
        if (existingUser.getAuthProvider() == User.AuthProvider.LOCAL) {
            existingUser.setAuthProvider(User.AuthProvider.GOOGLE);
            existingUser.setProviderId(providerId);
            existingUser.setIsEmailVerified(true);
        }
        if (name != null && !name.isEmpty()) {
            existingUser.setFullName(name);
        }
        if (picture != null && !picture.isEmpty()) {
            existingUser.setAvatar(picture);
        }
    }

    /**
     * Helper method to get display name from User entity
     */
    public String getDisplayName(User user) {
        if (user != null) {
            if (user.getFullName() != null && !user.getFullName().trim().isEmpty()) {
                return user.getFullName();
            }
            if (user.getEmail() != null) {
                return user.getEmail().split("@")[0]; // Use part before @ as display name
            }
        }
        return "Unknown User";
    }

    /**
     * Helper method to get role string from User entity
     */
    public String getRoleString(User user) {
        if (user != null && user.getRole() != null) {
            return user.getRole().name().toLowerCase();
        }
        return "user";
    }

    /**
     * Helper method to get formatted role display name
     */
    public String getRoleDisplayName(User user) {
        if (user != null && user.getRole() != null) {
            switch (user.getRole()) {
                case ADMIN:
                    return "Quản trị viên";
                case LAWYER:
                    return "Luật sư";
                case USER:
                default:
                    return "Người dùng";
            }
        }
        return "Người dùng";
    }
}
