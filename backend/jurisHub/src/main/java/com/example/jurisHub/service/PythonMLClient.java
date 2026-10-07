package com.example.jurisHub.service;

import com.example.jurisHub.dto.ai.PdfAskRequest;
import com.example.jurisHub.dto.ai.PdfAskResponse;
import com.example.jurisHub.dto.ai.PdfUploadMlResponse;
import com.example.jurisHub.dto.ai.RagAskRequest;
import com.example.jurisHub.dto.ai.RagAskResponse;
import com.example.jurisHub.dto.sentiment.SentimentResult;
import org.springframework.web.multipart.MultipartFile;

public interface PythonMLClient {

    // Sentiment analysis (cũ)
    SentimentResult analyzeSentiment(String text);

    // RAG chatbot hỏi đáp luật
    RagAskResponse askRag(RagAskRequest request);

    // PDF AI: upload file lên Python ML để index
    PdfUploadMlResponse uploadPdfToMl(MultipartFile file);

    // PDF AI: tóm tắt file đã upload
    PdfAskResponse summarizePdf(String fileId);

    // PDF AI: hỏi đáp về nội dung PDF
    PdfAskResponse askPdf(PdfAskRequest request);

    // PDF AI: giải phóng session
    void clearPdfSession(String fileId);
}
