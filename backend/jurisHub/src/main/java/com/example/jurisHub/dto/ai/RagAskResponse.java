package com.example.jurisHub.dto.ai;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class RagAskResponse {
    private String answer;
    private List<LegalSource> sources;

    @JsonProperty("confidence_score")
    private Double confidenceScore;

    @JsonProperty("processing_time")
    private Double processingTime;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class LegalSource {
        @JsonProperty("law_name")
        private String lawName;
        private String article;
        private String content;
        private Double score;
    }
}
