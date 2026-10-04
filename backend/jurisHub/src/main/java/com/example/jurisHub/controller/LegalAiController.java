package com.example.jurisHub.controller;

import com.example.jurisHub.dto.ai.PdfAskRequest;
import com.example.jurisHub.dto.ai.PdfAskResponse;
import com.example.jurisHub.dto.ai.PdfUploadMlResponse;
import com.example.jurisHub.dto.ai.RagAskRequest;
import com.example.jurisHub.dto.ai.RagAskResponse;
import com.example.jurisHub.dto.conversation.PdfUploadResponse;
import com.example.jurisHub.security.UserPrincipal;
import com.example.jurisHub.service.ApiKeyValidationService;
import com.example.jurisHub.service.PdfService;
import com.example.jurisHub.service.PythonMLClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.Map;

/**
 * REST API cho tính năng AI pháp lý:
 *  - RAG Chatbot hỏi đáp luật (/api/ai/rag/ask)
 *  - PDF Chat: upload, tóm tắt, hỏi đáp, clear session
 */
@Slf4j
@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:3001", "http://localhost:4200"})
public class LegalAiController {

    private final PythonMLClient pythonMLClient;
    private final PdfService pdfService;
    private final ApiKeyValidationService apiKeyValidationService;

    // ====================== RAG CHATBOT ======================

    /**
     * Hỏi đáp pháp luật qua RAG.
     * Frontend gọi: POST /api/ai/rag/ask
     */
    @PostMapping("/rag/ask")
    public ResponseEntity<?> ragAsk(
            @RequestBody RagAskRequest request,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        try {
            log.info("[RAG] User {} asks: {}", userPrincipal.getId(), request.getQuestion());
            // Validate API key (optional: bỏ comment nếu muốn giới hạn quota)
            // apiKeyValidationService.validateAndUseApiKey(userPrincipal.getId(), "rag");

            RagAskResponse response = pythonMLClient.askRag(request);
            if (response == null) {
                return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                        .body(Map.of("error", "Dịch vụ AI không phản hồi. Vui lòng thử lại."));
            }
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            log.error("[RAG] Error for user {}: {}", userPrincipal.getId(), e.getMessage());
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    // ====================== PDF AI ======================

    /**
     * Upload PDF lên Python ML để index vector store + lưu metadata vào Java DB.
     * Frontend gọi: POST /api/ai/pdf/upload (multipart/form-data)
     * Response: { pythonFileId, conversationId, filename, chunksCount }
     */
    @PostMapping("/pdf/upload")
    public ResponseEntity<?> uploadPdf(
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        try {
            log.info("[PDF] User {} uploading: {}", userPrincipal.getId(), file.getOriginalFilename());

            // 1. Upload lên Python ML để lập chỉ mục vector
            PdfUploadMlResponse mlResponse = pythonMLClient.uploadPdfToMl(file);
            if (mlResponse == null || !mlResponse.isSuccess()) {
                String errorMsg = mlResponse != null ? mlResponse.getMessage() : "ML service không phản hồi";
                return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                        .body(Map.of("error", "Lỗi xử lý PDF: " + errorMsg));
            }

            String pythonFileId = mlResponse.getFileId();
            log.info("[PDF] ML indexed successfully: fileId={}, chunks={}", pythonFileId, mlResponse.getChunksCount());

            // 2. Lưu metadata vào Java DB (conversation + pdf_document)
            PdfUploadResponse dbResponse = pdfService.uploadPdfAndCreateConversation(
                    file,
                    file.getOriginalFilename(),
                    null,          // summary - sẽ lấy sau
                    pythonFileId,
                    userPrincipal.getId()
            );

            // 3. Build response cho frontend
            Map<String, Object> result = new HashMap<>();
            result.put("pythonFileId", pythonFileId);
            result.put("filename", file.getOriginalFilename());
            result.put("chunksCount", mlResponse.getChunksCount());
            result.put("success", true);

            if (dbResponse.isSuccess() && dbResponse.getConversation() != null) {
                result.put("conversationId", dbResponse.getConversation().getId());
            }

            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("[PDF] Upload error for user {}: {}", userPrincipal.getId(), e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Lỗi tải lên PDF: " + e.getMessage()));
        }
    }

    /**
     * Yêu cầu tóm tắt nội dung PDF đã upload.
     * Frontend gọi: POST /api/ai/pdf/summarize?fileId={pythonFileId}
     */
    @PostMapping("/pdf/summarize")
    public ResponseEntity<?> summarizePdf(
            @RequestParam("fileId") String fileId,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        try {
            log.info("[PDF] User {} requests summary for fileId={}", userPrincipal.getId(), fileId);
            PdfAskResponse response = pythonMLClient.summarizePdf(fileId);
            if (response == null) {
                return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                        .body(Map.of("error", "Dịch vụ AI không phản hồi"));
            }
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("[PDF] Summarize error: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Hỏi đáp về nội dung PDF.
     * Frontend gọi: POST /api/ai/pdf/ask
     * Body: { pdfId, question, topK? }
     */
    @PostMapping("/pdf/ask")
    public ResponseEntity<?> askPdf(
            @RequestBody PdfAskRequest request,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        try {
            log.info("[PDF] User {} asks about fileId={}: {}", userPrincipal.getId(), request.getPdfId(), request.getQuestion());
            PdfAskResponse response = pythonMLClient.askPdf(request);
            if (response == null) {
                return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                        .body(Map.of("error", "Dịch vụ AI không phản hồi"));
            }
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("[PDF] Ask error: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Giải phóng bộ nhớ vector store cho session PDF.
     * Frontend gọi: DELETE /api/ai/pdf/session/{fileId}
     */
    @DeleteMapping("/pdf/session/{fileId}")
    public ResponseEntity<?> clearPdfSession(
            @PathVariable String fileId,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        log.info("[PDF] User {} clearing session: {}", userPrincipal.getId(), fileId);
        pythonMLClient.clearPdfSession(fileId);
        return ResponseEntity.ok(Map.of("message", "Session đã được giải phóng: " + fileId));
    }
}
