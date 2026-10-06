import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';

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

@Injectable({
  providedIn: 'root'
})
export class LegalAiService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl; // http://localhost:8080/api


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


  async clearPdfSession(pythonFileId: string): Promise<void> {
    await firstValueFrom(
      this.http.delete(
        `${this.apiUrl}/ai/pdf/session/${pythonFileId}`,
        { withCredentials: true }
      )
    );
  }
}
