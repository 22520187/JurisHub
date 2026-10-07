package com.example.jurisHub.dto.admin;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserManagementDto {
    private Long id;
    private String email;
    private String fullName;
    private String phoneNumber;
    private String avatar;
    private String role;
    private String authProvider;
    private Boolean isEmailVerified;
    private Boolean isEnabled;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Integer postsCount;
    private Integer messagesCount;
}
