package com.example.jurisHub.dto.conversation;

import com.example.jurisHub.entity.Conversation;
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
public class ConversationDto {
    private Long id;
    private Long userId;
    private Conversation.ConversationType type;
    private String title;
    private String summary;
    private String pythonFileId; // Store fileId from Python API for PDF Q/A
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<MessageDto> messages;
    private PdfDocumentDto pdfDocument;
    private int messageCount;
}
