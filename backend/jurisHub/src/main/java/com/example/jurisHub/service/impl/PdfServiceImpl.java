package com.example.jurisHub.service.impl;

import com.example.jurisHub.dto.conversation.ConversationDto;
import com.example.jurisHub.dto.conversation.PdfDocumentDto;
import com.example.jurisHub.dto.conversation.PdfUploadResponse;
import com.example.jurisHub.entity.Conversation;
import com.example.jurisHub.entity.PdfDocument;
import com.example.jurisHub.mapper.ConversationMapper;
import com.example.jurisHub.repository.ConversationRepository;
import com.example.jurisHub.repository.PdfDocumentRepository;
import com.example.jurisHub.service.PdfService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class PdfServiceImpl implements PdfService {

    private final ConversationRepository conversationRepository;
    private final PdfDocumentRepository pdfDocumentRepository;
    private final ConversationMapper conversationMapper;

    @Value("${app.pdf.upload-dir}")
    private String uploadDir;

    @Value("${app.pdf.max-size}")
    private long maxFileSize;

    @Override
    public PdfUploadResponse uploadPdfAndCreateConversation(MultipartFile file, String title, String summary, String pythonFileId, Long userId) {
        log.info("Uploading PDF file for user: {}, title: {}, pythonFileId: {}", userId, title, pythonFileId);

        try{
            if (!isValidPdfFile(file)) {
                return PdfUploadResponse.error("Invalid PDF file");
            }

            Conversation conversation = Conversation.builder()
                    .userId(userId)
                    .type(Conversation.ConversationType.PDF_QA)
                    .title(title)
                    .summary(summary)
                    .pythonFileId(pythonFileId)
                    .build();

            conversation = conversationRepository.save(conversation);

            String fileName = generateUniqueFileName(file.getOriginalFilename());
            Path filePath = saveFileToStorage(file, fileName);

            PdfDocument pdfDocument = PdfDocument.builder()
                    .conversationId(conversation.getId())
                    .originalFileName(file.getOriginalFilename())
                    .filePath(filePath.toString())
                    .fileSize(file.getSize())
                    .contentType(file.getContentType())
                    .build();

            pdfDocument = pdfDocumentRepository.save(pdfDocument);
            ConversationDto conversationDto = conversationMapper.toDto(conversation);
            PdfDocumentDto pdfDocumentDto = conversationMapper.toPdfDocumentDto(pdfDocument);
            return PdfUploadResponse.success(conversationDto, pdfDocumentDto);
        } catch (Exception e) {
            log.error("Error uploading PDF file", e);
            return PdfUploadResponse.error("Error uploading file: " + e.getMessage());
        }
    }

    @Override
    @Transactional(readOnly = true)
    public byte[] getPdfContent(Long conversationId, Long userId) {
        log.info("Getting PDF contents for conversation: {}, userId: {}", conversationId, userId);

        conversationRepository.findByIdAndUserId(conversationId, userId)
                .orElseThrow(() -> new RuntimeException("Conversation with id: " + conversationId + " not found"));

        PdfDocument pdfDocument = pdfDocumentRepository.findByConversationId(conversationId)
                .orElseThrow(() -> new RuntimeException("PDF document for conversation with id: " + conversationId + " not found"));

        try {
            Path filePath = Paths.get(pdfDocument.getFilePath());
            return Files.readAllBytes(filePath);
        } catch (IOException e) {
            log.error("Error reading PDF file", e);
            throw new RuntimeException("Error reading PDF file", e);
        }

    }

    @Override
    public boolean isValidPdfFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            return false;
        }
        if (file.getSize() > maxFileSize) {
            log.warn("PDF file size is greater than maxFileSize");
            return false;
        }

        String contentType = file.getContentType();
        if (contentType == null || !contentType.equals("application/pdf")) {
            log.warn("Invalid PDF file content type: {}", contentType);
            return false;
        }

        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null || !originalFilename.toLowerCase().endsWith(".pdf")) {
            log.warn("Invalid PDF file extension: {}", originalFilename);
            return false;
        }
        return true;
    }

    private String generateUniqueFileName(String originalFilename) {
        String extension = "";
        if (originalFilename != null && originalFilename.contains(".")) {
            extension = originalFilename.substring(originalFilename.lastIndexOf("."));
        }
        return UUID.randomUUID().toString() + extension;
    }

    private Path saveFileToStorage(MultipartFile file, String fileName) throws IOException {
        Path uploadPath = Paths.get(uploadDir);
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }
        Path filePath = uploadPath.resolve(fileName);
        Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

        return filePath;
    }
}
