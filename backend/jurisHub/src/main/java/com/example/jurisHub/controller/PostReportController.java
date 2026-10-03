package com.example.jurisHub.controller;

import com.example.jurisHub.dto.common.ApiResponse;
import com.example.jurisHub.dto.forum.PostReportCreateDto;
import com.example.jurisHub.dto.forum.PostReportDto;
import com.example.jurisHub.security.UserPrincipal;
import com.example.jurisHub.service.PostReportService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@Validated
@CrossOrigin(origins = {"http://localhost:3000, http://localhost:4200"})
public class PostReportController {

    private final PostReportService reportService;

    @PostMapping("/posts/{postId}/reports")
    public ResponseEntity<ApiResponse<PostReportDto>> createReport(
            @PathVariable Long postId,
            @Valid @RequestBody PostReportCreateDto reportDto,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        PostReportDto report = reportService.createReport(postId, reportDto, userPrincipal.getId());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Đã gửi báo cáo thành công", report));
    }

    @GetMapping("/posts/{postId}/reports/check")
    public ResponseEntity<ApiResponse<Boolean>> checkUserReported(
            @PathVariable Long postId,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        boolean hasReported = reportService.hasUserReportedPost(postId, userPrincipal.getId());
        return ResponseEntity.ok(ApiResponse.success(hasReported));
    }

    @GetMapping("/user/reports")
    public ResponseEntity<ApiResponse<List<PostReportDto>>> getUserReports(
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        List<PostReportDto> reports = reportService.getUserReports(userPrincipal.getId());
        return ResponseEntity.ok(ApiResponse.success(reports));
    }

    @GetMapping("/admin/reports")
    public ResponseEntity<ApiResponse<Page<PostReportDto>>> getAllReports(
            @PageableDefault(size = 20, sort = "createdAt") Pageable pageable,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        Page<PostReportDto> reports = reportService.getAllReports(pageable);
        return ResponseEntity.ok(ApiResponse.success(reports));
    }

    @GetMapping("/admin/reports/status/{status}")
    public ResponseEntity<ApiResponse<List<PostReportDto>>> getReportsByStatus(
            @PathVariable String status,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        List<PostReportDto> reports = reportService.getReportsByStatus(status);
        return ResponseEntity.ok(ApiResponse.success(reports));
    }

    @GetMapping("/admin/reports/{reportId}")
    public ResponseEntity<ApiResponse<PostReportDto>> getReportById(
            @PathVariable Long reportId,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        PostReportDto report = reportService.getReportById(reportId);
        return ResponseEntity.ok(ApiResponse.success(report));
    }

    @PutMapping("/admin/reports/{reportId}/status")
    public ResponseEntity<ApiResponse<PostReportDto>> updateReportStatus(
            @PathVariable Long reportId,
            @RequestParam String status,
            @RequestParam(required = false) String reviewNote,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        PostReportDto report = reportService.updateReportStatus(reportId, status, reviewNote, userPrincipal.getId());
        return ResponseEntity.ok(ApiResponse.success("Đã cập nhật trạng thái báo cáo", report));
    }

    @GetMapping("/admin/reports/count/pending")
    public ResponseEntity<ApiResponse<Long>> countPendingReports(
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        long count = reportService.countPendingReports();
        return ResponseEntity.ok(ApiResponse.success(count));
    }

    @GetMapping("/admin/posts/{postId}/reports")
    public ResponseEntity<ApiResponse<List<PostReportDto>>> getReportsByPostId(
            @PathVariable Long postId,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        List<PostReportDto> reports = reportService.getReportsByPostId(postId);
        return ResponseEntity.ok(ApiResponse.success(reports));
    }
}
