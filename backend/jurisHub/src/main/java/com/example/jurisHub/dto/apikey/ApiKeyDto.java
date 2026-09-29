package com.example.jurisHub.dto.apikey;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApiKeyDto {
    private Long id;
    private String key;
    private Integer totalLimit;
    private Integer usedCount;
    private Integer pdfQaCount;
    private Integer chatQaCount;
    private Integer remainingCalls;
    private Boolean isActive;
    private LocalDateTime createdAt;
    private LocalDateTime expiresAt;
}
