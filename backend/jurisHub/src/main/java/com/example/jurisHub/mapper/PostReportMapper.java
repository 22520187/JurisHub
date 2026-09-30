package com.example.jurisHub.mapper;

import com.example.jurisHub.dto.forum.PostReportDto;
import com.example.jurisHub.dto.user.UserBasicDto;
import com.example.jurisHub.entity.PostReport;
import com.example.jurisHub.entity.User;
import org.springframework.stereotype.Component;

@Component
public class PostReportMapper {
    public PostReportDto toDto(PostReport report) {
        if (report == null) {
            return null;
        }

        return PostReportDto.builder()
                .id(report.getId())
                .postId(report.getPost() != null ? report.getPost().getId() : null)
                .postTitle(report.getPost() != null ? report.getPost().getTitle() : null)
                .reporter(report.getReporter() != null ? mapUserToBasicDto(report.getReporter()) : null)
                .reason(report.getReason())
                .description(report.getDescription())
                .status(report.getStatus() != null ? report.getStatus().name() : null)
                .reviewedBy(report.getReviewedBy() != null ? mapUserToBasicDto(report.getReviewedBy()) : null)
                .reviewedAt(report.getReviewedAt())
                .reviewNote(report.getReviewNote())
                .createdAt(report.getCreatedAt())
                .build();
    }

    private UserBasicDto mapUserToBasicDto(User user) {
        if (user == null) {
            return null;
        }

        UserBasicDto dto = new UserBasicDto();
        dto.setId(user.getId());
        dto.setName(user.getFullName());
        dto.setEmail(user.getEmail());
        dto.setAvatar(user.getAvatar());
        dto.setRole(user.getRole() != null ? user.getRole().name() : null);
        return dto;
    }
}
