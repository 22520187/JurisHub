package com.example.jurisHub.service;

import com.example.jurisHub.dto.forum.PostReportCreateDto;
import com.example.jurisHub.dto.forum.PostReportDto;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface PostReportService {

    PostReportDto createReport(Long postId, PostReportCreateDto reportDto, Long reporterId);

    Page<PostReportDto> getAllReports(Pageable pageable);

    List<PostReportDto> getReportsByStatus(String status);

    List<PostReportDto> getReportsByPostId(Long postId);

    PostReportDto getReportById(Long reportId);

    List<PostReportDto> getUserReports(Long userId);

    boolean hasUserReportedPost(Long postId, Long userId);

    PostReportDto updateReportStatus(Long reportId, String status, String reviewNote, Long reviewerId);

    long countPendingReports();
}
