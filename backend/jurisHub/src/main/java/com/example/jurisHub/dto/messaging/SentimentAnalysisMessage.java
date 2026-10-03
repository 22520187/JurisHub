package com.example.jurisHub.dto.messaging;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SentimentAnalysisMessage implements Serializable {
    private Long entityId;
    private String entityType; // "POST" or "REPLY"
    private String content;
    private String title; // Optional, for posts
    private Long authorId;
}
