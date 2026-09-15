package com.example.jurisHub.dto.user;

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
public class UserProfileDto {

    private Long id;
    private String email;
    private String fullName;
    private String avatar;
    private String role;
    private Long postCount;
    private Long replyCount;
    private LocalDateTime joinedAt;
    private String phoneNumber;
    private String bio;
    private List<String> legalExpertise;
}
