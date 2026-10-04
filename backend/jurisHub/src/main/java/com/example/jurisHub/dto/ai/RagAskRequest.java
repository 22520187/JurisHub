package com.example.jurisHub.dto.ai;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RagAskRequest {
    private String question;
    private List<ChatHistoryItem> chatHistory;
    private Integer topK;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ChatHistoryItem {
        private String role;   // "user" hoặc "assistant"
        private String content;
    }
}
