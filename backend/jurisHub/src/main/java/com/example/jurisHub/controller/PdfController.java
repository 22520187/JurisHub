package com.example.jurisHub.controller;

import com.example.jurisHub.dto.conversation.PdfUploadResponse;
import com.example.jurisHub.security.UserPrincipal;
import com.example.jurisHub.service.ApiKeyValidationService;
import com.example.jurisHub.service.PdfService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/pdf")
@RequiredArgsConstructor
public class PdfController {

    private final PdfService pdfService;
    private final ApiKeyValidationService apiKeyValidationService;

    @PostMapping("/upload")
    public ResponseEntity<PdfUploadResponse> uploadPdf(
            @RequestParam("file") MultipartFile file,
            @RequestParam("title") String title,
            @RequestParam(value = "summary", required = false) String summary,
            @RequestParam(value = "pythonFileId", required = false) String pythonFileId,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        apiKeyValidationService.validateAndUseApiKey(userPrincipal.getId(), "pdf");

        PdfUploadResponse response = pdfService.uploadPdfAndCreateConversation(file, title, summary, pythonFileId, userPrincipal.getId());

        if (response.isSuccess()) {
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.badRequest().body(response);
        }
    }

    @GetMapping("/download/{conversationId}")
    public ResponseEntity<ByteArrayResource> downloadPdf(
            @PathVariable Long conversationId,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        byte[] pdfContent = pdfService.getPdfContent(conversationId, userPrincipal.getId());
        ByteArrayResource resource = new ByteArrayResource(pdfContent);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=document.pdf")
                .contentType(MediaType.APPLICATION_PDF)
                .contentLength(pdfContent.length)
                .body(resource);

    }

    @GetMapping("/view/{conversationId}")
    public ResponseEntity<ByteArrayResource> viewPdf(
            @PathVariable Long conversationId,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        byte[] pdfContent = pdfService.getPdfContent(conversationId, userPrincipal.getId());
        ByteArrayResource resource = new ByteArrayResource(pdfContent);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=document.pdf")
                .contentType(MediaType.APPLICATION_PDF)
                .contentLength(pdfContent.length)
                .body(resource);
    }
}
