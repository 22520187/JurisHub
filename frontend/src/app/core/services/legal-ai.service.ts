import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';

// ========================= Interfaces =========================

export interface ChatHistoryItem {
  role: 'user' | 'assistant';
  content: string;
}

export interface LegalSource {
  lawName: string;
  article: string;
  content: string;
  score: number;
}

export interface RagAskResponse {
  answer: string;
  sources: LegalSource[];
  confidenceScore?: number;
  processingTime?: number;
}

export interface PdfUploadResult {
  pythonFileId: string;
  conversationId?: number;
  filename: string;
  chunksCount: number;
  success: boolean;
}

export interface PdfAskResult {
  success: boolean;
  message: string;
  data: {
    answer?: string;
    summary?: string;
    page_references?: number[];
    question?: string;
    pdf_id?: string;
  };
}

// ========================= Service =========================

@Injectable({
  providedIn: 'root'
})
export class LegalAiService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl; // http://localhost:8080/api

  /**
   * Gọi RAG chatbot hỏi đáp pháp luật.
   * POST /api/ai/rag/ask
   */
  async askRag(
    question: string,
    chatHistory: ChatHistoryItem[] = []
  ): Promise<RagAskResponse> {
    const response = await firstValueFrom(
      this.http.post<RagAskResponse>(
        `${this.apiUrl}/ai/rag/ask`,
        { question, chatHistory, topK: 5 },
        { withCredentials: true }
      )
    );
    return response;
  }

  /**
   * Upload file PDF lên backend → ML để index vector store.
   * POST /api/ai/pdf/upload (multipart)
   */
  async uploadPdf(file: File): Promise<PdfUploadResult> {
    const formData = new FormData();
    formData.append('file', file, file.name);

    const response = await firstValueFrom(
      this.http.post<PdfUploadResult>(
        `${this.apiUrl}/ai/pdf/upload`,
        formData,
        { withCredentials: true }
      )
    );
    return response;
  }

  /**
   * Yêu cầu tóm tắt nội dung PDF đã upload.
   * POST /api/ai/pdf/summarize?fileId={pythonFileId}
   */
  async summarizePdf(pythonFileId: string): Promise<PdfAskResult> {
    const response = await firstValueFrom(
      this.http.post<PdfAskResult>(
        `${this.apiUrl}/ai/pdf/summarize`,
        null,
        {
          withCredentials: true,
          params: { fileId: pythonFileId }
        }
      )
    );
    return response;
  }

  /**
   * Hỏi đáp về nội dung file PDF.
   * POST /api/ai/pdf/ask
   */
  async askPdf(pythonFileId: string, question: string): Promise<PdfAskResult> {
    const response = await firstValueFrom(
      this.http.post<PdfAskResult>(
        `${this.apiUrl}/ai/pdf/ask`,
        { pdfId: pythonFileId, question, topK: 5 },
        { withCredentials: true }
      )
    );
    return response;
  }

  /**
   * Giải phóng bộ nhớ vector store cho session PDF.
   * DELETE /api/ai/pdf/session/{fileId}
   */
  async clearPdfSession(pythonFileId: string): Promise<void> {
    await firstValueFrom(
      this.http.delete(
        `${this.apiUrl}/ai/pdf/session/${pythonFileId}`,
        { withCredentials: true }
      )
    );
  }
}
