package com.example.jurisHub.service.impl;

import com.example.jurisHub.dto.forum.PostReportCreateDto;
import com.example.jurisHub.dto.forum.PostReportDto;
import com.example.jurisHub.entity.Post;
import com.example.jurisHub.entity.PostReport;
import com.example.jurisHub.entity.User;
import com.example.jurisHub.mapper.PostReportMapper;
import com.example.jurisHub.repository.ForumRepository;
import com.example.jurisHub.repository.PostReportRepository;
import com.example.jurisHub.repository.UserRepository;
import com.example.jurisHub.service.PostReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class PostReportServiceImpl implements PostReportService {
    private final PostReportRepository reportRepository;
    private final ForumRepository postRepository;
    private final UserRepository userRepository;
    private final PostReportMapper reportMapper;

    @Override
    public PostReportDto createReport(Long postId, PostReportCreateDto reportDto, Long reporterId){
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found with id: " + postId));
        User reporter = userRepository.findById(reporterId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + reporterId));

        if (reportRepository.existsByPostIdAndReporterId(postId, reporterId)) {
            throw new RuntimeException("You have already reported this post.");
        }

        PostReport report = PostReport.builder()
                .post(post)
                .reporter(reporter)
                .reason(reportDto.getReason())
                .description(reportDto.getDescription())
                .status(PostReport.ReportStatus.PENDING)
                .build();

        report = reportRepository.save(report);

        post.addReport();
        postRepository.save(post);

        return reportMapper.toDto(report);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<PostReportDto> getAllReports(Pageable pageable) {
        return reportRepository.findAll(pageable)
                .map(reportMapper::toDto);
    }

    @Override
    @Transactional(readOnly = true)
    public List<PostReportDto> getReportsByStatus(String status) {
        PostReport.ReportStatus reportStatus;
        try {
            reportStatus = PostReport.ReportStatus.valueOf(status.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("Trạng thái báo cáo không hợp lệ");
        }

        return reportRepository.findAllByStatusWithDetails(reportStatus)
                .stream()
                .map(reportMapper::toDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<PostReportDto> getReportsByPostId(Long postId) {
        return reportRepository.findByPostIdOrderByCreatedAtDesc(postId)
                .stream()
                .map(reportMapper::toDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public PostReportDto getReportById(Long reportId) {
        PostReport report = reportRepository.findByIdWithDetails(reportId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy báo cáo"));
        return reportMapper.toDto(report);
    }

    @Override
    @Transactional(readOnly = true)
    public List<PostReportDto> getUserReports(Long userId) {
        return reportRepository.findByReporterIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(reportMapper::toDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public boolean hasUserReportedPost(Long postId, Long userId) {
        return reportRepository.existsByPostIdAndReporterId(postId, userId);
    }

    @Override
    public PostReportDto updateReportStatus(Long reportId, String status, String reviewNote, Long reviewerId) {
        PostReport report = reportRepository.findById(reportId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy báo cáo"));

        PostReport.ReportStatus reportStatus;
        try {
            reportStatus = PostReport.ReportStatus.valueOf(status.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("Trạng thái báo cáo không hợp lệ");
        }

        User reviewer = userRepository.findById(reviewerId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người xem xét"));

        report.setStatus(reportStatus);
        report.setReviewNote(reviewNote);
        report.setReviewedBy(reviewer);
        report.setReviewedAt(LocalDateTime.now());

        report = reportRepository.save(report);

        return reportMapper.toDto(report);
    }

    @Override
    @Transactional(readOnly = true)
    public long countPendingReports() {

        return reportRepository.countByStatus(PostReport.ReportStatus.PENDING);
    }

}
