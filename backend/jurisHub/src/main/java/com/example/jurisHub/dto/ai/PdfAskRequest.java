package com.example.jurisHub.dto.ai;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PdfAskRequest {
    @JsonProperty("pdf_id")
    private String pdfId;
    private String question;
    @JsonProperty("top_k")
    private Integer topK = 5;
}
