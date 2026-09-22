package com.example.jurisHub.dto.conversation;

import com.example.jurisHub.entity.Message;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MessageDto {
    private Long id;
    private Long conversationId;
    private String content;
    private Message.MessageRole role;
    private LocalDateTime createdAt;
}
