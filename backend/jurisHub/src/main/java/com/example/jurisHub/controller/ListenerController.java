package com.example.jurisHub.controller;

import com.example.jurisHub.dto.admin.LawyerApplicationDto;
import com.example.jurisHub.dto.common.ApiResponse;
import com.example.jurisHub.dto.lawyer.LawyerApplicationRequest;
import com.example.jurisHub.service.LawyerApplicationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/lawyer")
@RequiredArgsConstructor
@Slf4j
public class LawyerController {

    private final LawyerApplicationService lawyerApplicationService;

    @PostMapping("/apply")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<ApiResponse<LawyerApplicationDto>> submitApplication(@Valid @RequestBody LawyerApplicationRequest request) {
            log.info("Received lawyer application request - Bio length: {}, Bio content: '{}'",
                    request.getBio() != null ? request.getBio().length() : 0,
                    request.getBio() != null ? request.getBio().substring(0, Math.min(50, request.getBio().length())) : "null");

            LawyerApplicationDto application = lawyerApplicationService.submitApplication(request);

            return ResponseEntity.ok(ApiResponse.<LawyerApplicationDto>builder()
                    .success(true)
                    .message("Lawyer application submitted successfully")
                    .data(application)
                    .build());
    }

    @GetMapping("/application")
    @PreAuthorize("hasRole('USER') or hasRole('LAWYER')")
    public ResponseEntity<ApiResponse<LawyerApplicationDto>> getUserApplication() {

        Optional<LawyerApplicationDto> application = lawyerApplicationService.getUserApplication();

        if (application.isPresent()) {
            return ResponseEntity.ok(ApiResponse.<LawyerApplicationDto>builder()
                    .success(true)
                    .message("Application retrieved successfully")
                    .data(application.get())
                    .build());
        } else {
            return ResponseEntity.ok(ApiResponse.<LawyerApplicationDto>builder()
                    .success(false)
                    .message("No application found")
                    .build());
        }
    }

    @GetMapping("/can-apply")
    @PreAuthorize("hasRole('USER') or hasRole('LAWYER')")
    public ResponseEntity<ApiResponse<Boolean>> canUserApply() {

        boolean canApply = lawyerApplicationService.canUserApply();

        return ResponseEntity.ok(ApiResponse.<Boolean>builder()
                .success(true)
                .message(canApply ? "User can apply" : "User cannot apply")
                .data(canApply)
                .build());
    }

    @GetMapping("/has-applied")
    @PreAuthorize("hasRole('USER') or hasRole('LAWYER')")
    public ResponseEntity<ApiResponse<Boolean>> hasUserApplied() {

        boolean hasApplied = lawyerApplicationService.hasUserApplied();

        return ResponseEntity.ok(ApiResponse.<Boolean>builder()
                .success(true)
                .message(hasApplied ? "User has applied" : "User has not applied")
                .data(hasApplied)
                .build());
    }

    @PutMapping("/application/{applicationId}/documents")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<ApiResponse<LawyerApplicationDto>> updateApplicationDocuments(
            @PathVariable Long applicationId,
            @RequestBody List<String> documentUrls) {

            LawyerApplicationDto updatedApplication = lawyerApplicationService.updateApplicationDocuments(applicationId, documentUrls);

            return ResponseEntity.ok(ApiResponse.<LawyerApplicationDto>builder()
                    .success(true)
                    .message("Application documents updated successfully")
                    .data(updatedApplication)
                    .build());

    }

    @DeleteMapping("/application/{applicationId}")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<ApiResponse<String>> deleteApplication(@PathVariable Long applicationId) {

            lawyerApplicationService.deleteApplication(applicationId);

            return ResponseEntity.ok(ApiResponse.<String>builder()
                    .success(true)
                    .message("Application deleted successfully")
                    .data("Application and associated documents have been removed")
                    .build());
    }
}
