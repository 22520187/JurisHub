package com.example.jurisHub.dto.conversation;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PdfDocumentDto {
    private Long id;
    private Long conversationId;
    private String originalFileName;
    private String filePath;
    private Long fileSize;
    private String contentType;
    private LocalDateTime uploadedAt;
}
