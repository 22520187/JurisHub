package com.example.jurisHub.dto.chat;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatMessage {
    private String id;
    private String content;
    private String senderId;
    private String senderName;
    private String conversationId;
    private String receiverId;
    private MessageType type;
    private LocalDateTime timestamp;

    public enum MessageType {
        CHAT,
        JOIN,
        LEAVE,
        TYPING,
        STOP_TYPING
    }
}
