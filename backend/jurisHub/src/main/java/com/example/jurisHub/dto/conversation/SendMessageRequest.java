package com.example.jurisHub.dto.conversation;

import com.example.jurisHub.entity.Message;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SendMessageRequest {
    @NotNull(message = "Conversation ID is required")
    private Long conversationId;

    @NotBlank(message = "Message content is required")
    private String content;

    @NotNull(message = "Message role is required")
    private Message.MessageRole role;
}
