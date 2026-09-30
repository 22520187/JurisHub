package com.example.jurisHub.service;

import com.example.jurisHub.dto.conversation.PdfUploadResponse;
import org.springframework.web.multipart.MultipartFile;

public interface PdfService {

    /**
     * Upload PDF file and create a conversation
     */
    PdfUploadResponse uploadPdfAndCreateConversation(MultipartFile file, String title, String summary, String pythonFileId, Long userId);

    /**
     * Get PDF document for a conversation
     */
    byte[] getPdfContent(Long conversationId, Long userId);

    /**
     * Validate PDF file
     */
    boolean isValidPdfFile(MultipartFile file);

}
