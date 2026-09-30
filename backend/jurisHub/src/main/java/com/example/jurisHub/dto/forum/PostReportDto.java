package com.example.jurisHub.dto.forum;

import com.example.jurisHub.dto.user.UserBasicDto;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PostReportDto {

    private Long id;
    private Long postId;
    private String postTitle;
    private UserBasicDto reporter;
    private String reason;
    private String description;
    private String status;
    private UserBasicDto reviewedBy;
    private LocalDateTime reviewedAt;
    private String reviewNote;
    private LocalDateTime createdAt;
}
