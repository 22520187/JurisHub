package com.example.jurisHub.service.impl;

import com.example.jurisHub.dto.ai.PdfAskRequest;
import com.example.jurisHub.dto.ai.PdfAskResponse;
import com.example.jurisHub.dto.ai.PdfUploadMlResponse;
import com.example.jurisHub.dto.ai.RagAskRequest;
import com.example.jurisHub.dto.ai.RagAskResponse;
import com.example.jurisHub.dto.sentiment.SentimentResult;
import com.example.jurisHub.service.PythonMLClient;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

@Slf4j
@Service
public class PythonMLClientImpl implements PythonMLClient {

    private final RestTemplate restTemplate;

    @Value("${app.ml.url}")
    private String mlServiceUrl;

    public PythonMLClientImpl() {
        this.restTemplate = new RestTemplate();
    }

    // ====================== SENTIMENT (cũ) ======================

    @Override
    public SentimentResult analyzeSentiment(String text) {
        String url = mlServiceUrl + "/sentiment/analyze";
        try {
            log.info("Calling ML sentiment analysis at: {}", url);
            return restTemplate.postForObject(url, Map.of("text", text), SentimentResult.class);
        } catch (Exception e) {
            log.error("Error calling ML sentiment: {}", e.getMessage());
            return null;
        }
    }

    // ====================== RAG CHATBOT ======================

    @Override
    public RagAskResponse askRag(RagAskRequest request) {
        String url = mlServiceUrl + "/api/v1/rag/ask";
        try {
            log.info("Calling ML RAG at: {} | question: {}", url, request.getQuestion());
            RagAskResponse response = restTemplate.postForObject(url, request, RagAskResponse.class);
            log.info("ML RAG response received, answer length: {}",
                    response != null && response.getAnswer() != null ? response.getAnswer().length() : 0);
            return response;
        } catch (HttpServerErrorException e) {
            log.error("ML RAG server error ({}): {}", e.getStatusCode(), e.getResponseBodyAsString());
            throw new RuntimeException("Dịch vụ AI đang quá tải. Vui lòng thử lại sau.", e);
        } catch (HttpClientErrorException e) {
            log.error("ML RAG client error ({}): {}", e.getStatusCode(), e.getResponseBodyAsString());
            throw new RuntimeException("Yêu cầu không hợp lệ: " + e.getMessage(), e);
        } catch (Exception e) {
            log.error("Error calling ML RAG service: {}", e.getMessage());
            throw new RuntimeException("Không thể kết nối tới dịch vụ AI. Vui lòng kiểm tra kết nối.", e);
        }
    }

    // ====================== PDF AI ======================

    @Override
    public PdfUploadMlResponse uploadPdfToMl(MultipartFile file) {
        String url = mlServiceUrl + "/pdf/upload";
        try {
            log.info("Uploading PDF to ML service: {} | size: {} bytes", file.getOriginalFilename(), file.getSize());

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.MULTIPART_FORM_DATA);

            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            ByteArrayResource fileResource = new ByteArrayResource(file.getBytes()) {
                @Override
                public String getFilename() {
                    return file.getOriginalFilename();
                }
            };
            body.add("file", fileResource);

            HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);
            ResponseEntity<PdfUploadMlResponse> response = restTemplate.postForEntity(url, requestEntity, PdfUploadMlResponse.class);

            log.info("ML PDF upload response: success={}, fileId={}", 
                response.getBody() != null ? response.getBody().isSuccess() : false,
                response.getBody() != null ? response.getBody().getFileId() : "null");

            return response.getBody();
        } catch (IOException e) {
            log.error("Error reading PDF file bytes: {}", e.getMessage());
            throw new RuntimeException("Lỗi đọc file PDF: " + e.getMessage(), e);
        } catch (Exception e) {
            log.error("Error uploading PDF to ML service: {}", e.getMessage());
            throw new RuntimeException("Lỗi upload PDF lên dịch vụ AI: " + e.getMessage(), e);
        }
    }

    @Override
    public PdfAskResponse summarizePdf(String fileId) {
        String url = mlServiceUrl + "/pdf/summarize-id";
        try {
            log.info("Requesting PDF summary from ML for fileId: {}", fileId);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

            MultiValueMap<String, String> formData = new LinkedMultiValueMap<>();
            formData.add("file_id", fileId);
            formData.add("max_length", "500");

            HttpEntity<MultiValueMap<String, String>> requestEntity = new HttpEntity<>(formData, headers);
            ResponseEntity<PdfAskResponse> response = restTemplate.postForEntity(url, requestEntity, PdfAskResponse.class);
            return response.getBody();
        } catch (Exception e) {
            log.error("Error summarizing PDF (fileId={}): {}", fileId, e.getMessage());
            throw new RuntimeException("Lỗi tóm tắt PDF: " + e.getMessage(), e);
        }
    }

    @Override
    public PdfAskResponse askPdf(PdfAskRequest request) {
        String url = mlServiceUrl + "/pdf/ask";
        try {
            log.info("Asking PDF question via ML: fileId={}, question={}", request.getPdfId(), request.getQuestion());
            return restTemplate.postForObject(url, request, PdfAskResponse.class);
        } catch (Exception e) {
            log.error("Error asking PDF question: {}", e.getMessage());
            throw new RuntimeException("Lỗi hỏi đáp PDF: " + e.getMessage(), e);
        }
    }

    @Override
    public void clearPdfSession(String fileId) {
        String url = mlServiceUrl + "/pdf/session/" + fileId;
        try {
            log.info("Clearing PDF session for fileId: {}", fileId);
            restTemplate.delete(url);
        } catch (Exception e) {
            log.warn("Error clearing PDF session (fileId={}): {}", fileId, e.getMessage());
        }
    }
}
