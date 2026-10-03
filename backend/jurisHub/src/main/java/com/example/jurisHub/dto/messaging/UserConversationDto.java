package com.example.jurisHub.dto.messaging;

import com.example.jurisHub.entity.User;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserConversationDto {
    private Long id;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ParticipantDto {
        private Long id;
        private String name;
        private String email;
        private String avatar;
        private User.Role role;
        private Boolean online;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LastMessageDto {
        private String content;
        private LocalDateTime timestamp;
        private Long senderId;
    }

    private ParticipantDto participant;
    private LastMessageDto lastMessage;
    private Integer unreadCount;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
