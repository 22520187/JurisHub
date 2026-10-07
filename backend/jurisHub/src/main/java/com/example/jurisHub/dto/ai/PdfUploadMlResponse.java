package com.example.jurisHub.dto.ai;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class PdfUploadMlResponse {
    private boolean success;
    private String message;
    private Map<String, Object> data;

    // Helper để lấy file_id từ data map
    public String getFileId() {
        if (data == null) return null;
        Object fileId = data.get("file_id");
        return fileId != null ? fileId.toString() : null;
    }

    public String getFilename() {
        if (data == null) return null;
        Object filename = data.get("filename");
        return filename != null ? filename.toString() : null;
    }

    public Integer getChunksCount() {
        if (data == null) return null;
        Object chunks = data.get("chunks_count");
        return chunks != null ? Integer.parseInt(chunks.toString()) : null;
    }
}
