package com.example.jurisHub.dto.ai;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class PdfAskResponse {
    private boolean success;
    private String message;
    private Map<String, Object> data;

    public String getAnswer() {
        if (data == null) return null;
        Object answer = data.get("answer");
        return answer != null ? answer.toString() : null;
    }

    @SuppressWarnings("unchecked")
    public List<Integer> getPageReferences() {
        if (data == null) return null;
        Object pages = data.get("page_references");
        if (pages instanceof List) {
            return (List<Integer>) pages;
        }
        return null;
    }
}
