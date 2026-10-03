package com.example.jurisHub.controller;

import com.example.jurisHub.dto.common.ApiResponse;
import com.example.jurisHub.service.CloudinaryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.Arrays;
import java.util.List;

@RestController
@RequestMapping("/api/upload")
@RequiredArgsConstructor
@Slf4j
public class FileUploadController {

    private final CloudinaryService cloudinaryService;

    @PostMapping("/documents")
    public ResponseEntity<ApiResponse<List<String>>> uploadDocuments(
            @RequestParam("files") MultipartFile[] files) {
        if (files == null || files.length == 0) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.<List<String>>builder()
                            .success(false)
                            .message("No files provided")
                            .build());
        }

        String[] uploadedUrls = cloudinaryService.uploadFiles(files, "lawyer-documents");
        List<String> urlList = Arrays.asList(uploadedUrls);

        return ResponseEntity.ok(ApiResponse.<List<String>>builder()
                .success(true)
                .message("Documents uploaded successfully")
                .data(urlList)
                .build());
    }

    @PostMapping("/avatar")
    public ResponseEntity<ApiResponse<String>> uploadAvatar(
            @RequestParam("file") MultipartFile file) {

        try {
            if (file.isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(ApiResponse.<String>builder()
                                .success(false)
                                .message("No file provided")
                                .build());
            }

            String uploadedUrl = cloudinaryService.uploadFile(file, "avatars");

            return ResponseEntity.ok(ApiResponse.<String>builder()
                    .success(true)
                    .message("Avatar uploaded successfully")
                    .data(uploadedUrl)
                    .build());

        } catch (Exception e) {
            log.error("Error uploading avatar: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.<String>builder()
                            .success(false)
                            .message("Error uploading avatar: " + e.getMessage())
                            .build());
        }
    }

}
