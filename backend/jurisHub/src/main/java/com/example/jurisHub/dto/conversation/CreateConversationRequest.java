package com.example.jurisHub.dto.conversation;

import com.example.jurisHub.entity.Conversation;
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
public class CreateConversationRequest {
    @NotNull(message = "Conversation type is required")
    private Conversation.ConversationType type;

    @NotBlank(message = "Title is required")
    private String title;

    private String summary;

    private String pythonFileId; // Store fileId from Python API for PDF Q/A

    private String initialMessage;
}
