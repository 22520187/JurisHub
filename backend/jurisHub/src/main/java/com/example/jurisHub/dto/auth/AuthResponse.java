package com.example.jurisHub.dto.auth;

import com.example.jurisHub.entity.User;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponse {
    private Long id;

    private String email;

    private String fullName;

    private String phoneNumber;

    private String avatar;

    private User.Role role;

    private User.AuthProvider authProvider;

    public static AuthResponse fromUser(User user) {
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
}
