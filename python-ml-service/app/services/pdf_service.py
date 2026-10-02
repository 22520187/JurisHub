import io
import os
import hashlib
from typing import List, Dict, Optional, Any
from pathlib import Path
import httpx
from loguru import logger

import fitz  # PyMuPDF
import pypdf
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import Chroma
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain.schema import Document

from app.core.config import get_settings

class PDFService:
    """Service for PDF processing and Q&A"""

    def __init__(self):
        self.settings = get_settings()

        # Initialize embeddings for vector search
        logger.info("Initializing PDF embeddings...")
        self.embeddings = HuggingFaceEmbeddings(
            model_name=self.settings.embedding_model,
            model_kwargs={'device': 'cpu'},
            encode_kwargs={'normalize_embeddings': True}
        )

        # Text splitter for chunking
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=self.settings.chunk_size,
            chunk_overlap=self.settings.chunk_overlap,
            separators=["\n\n", "\n", ".", "!", "?", ",", " ", ""]
        )

        # Store for PDF sessions
        self.pdf_stores: Dict[str, Chroma] = {}

        # Setup upload directory
        self.pdf_upload_dir = Path("data/uploads/pdfs")
        self.pdf_upload_dir.mkdir(parents=True, exist_ok=True)
        
        logger.info("PDF Service initialized successfully")

    #    =========================================================================
    # 🔹 PHẦN 1: TRÍCH XUẤT VĂN BẢN (Text Extraction)
    # =========================================================================

    def extract_text_from_pdf(self, pdf_content: bytes) -> str:
        """Trích xuất text từ file PDF: Ưu tiên PyMuPDF, fallback sang pypdf"""
        try:
            # Thử bằng PyMuPDF (nhanh, giữ định dạng tốt)
            doc = fitz.open(stream=pdf_content, filetype="pdf")
            text_parts = []
            for page in doc:
                text = page.get_text()
                if text.strip():
                    text_parts.append(text.strip())
            doc.close()
            if text_parts:
                full_text = "\n\n".join(text_parts)
                logger.info(f" Trích xuất thành công {len(full_text)} ký tự bằng PyMuPDF.")
                return full_text
        except Exception as e:
            logger.warning(f"PyMuPDF gặp lỗi ({e}), chuyển sang pypdf fallback...")

        try:
            # Fallback bằng pypdf
            reader = pypdf.PdfReader(io.BytesIO(pdf_content))
            text_parts = []
            for page in reader.pages:
                text = page.extract_text()
                if text and text.strip():
                    text_parts.append(text.strip())
            full_text = "\n\n".join(text_parts)
            logger.info(f"Trích xuất thành công {len(full_text)} ký tự bằng pypdf.")
            return full_text
        except Exception as e:
            logger.error(f" Thất bại trích xuất PDF: {e}")
            raise ValueError(f"Không thể đọc văn bản từ file PDF: {str(e)}")

    def generate_pdf_id(self, pdf_content: bytes) -> str:
        return hashlib.md5(pdf_content).hexdigest()

    def save_pdf_file(self, pdf_content: bytes, pdf_id: str, filename: str) -> Path:
        # Save with just pdf_id to make retrieval easier
        file_path = self.pdf_upload_dir / f"{pdf_id}.pdf"
        with open(file_path, 'wb') as f:
            f.write(pdf_content)
        logger.info(f"Saved PDF to {file_path}")
        return file_path
    
    def get_pdf_content(self, pdf_id: str) -> Optional[bytes]:
        file_path = self.pdf_upload_dir / f"{pdf_id}.pdf"
        if file_path.exists():
            with open(file_path, 'rb') as f:
                return f.read()
        return None

    # =========================================================================
    # 🔹 PHẦN 2: KẾT NỐI LLM (Google Gemini & OpenRouter)
    # =========================================================================

    async def _call_llm(self, prompt: str, system_prompt: Optional[str] = None) -> str:
        """Hàm gọi LLM linh hoạt: Hỗ trợ Google Gemini và OpenRouter"""
        provider = getattr(self.settings, "llm_provider", "google").lower()
        google_api_key = getattr(self.settings, "google_api_key", "") or getattr(self.settings, "GOOGLE_API_KEY", "")
        openrouter_api_key = getattr(self.settings, "openrouter_api_key", "") or getattr(self.settings, "OPENROUTER_API_KEY", "")
        # 1. Ưu tiên Google Gemini nếu có key
        if google_api_key and (provider == "google" or not openrouter_api_key):
            model = getattr(self.settings, "llm_model", "gemini-flash-latest")
            if model in ["gemini-pro", "gemini-1.5-flash"]:
                model = "gemini-flash-latest"
            full_prompt = f"{system_prompt}\n\n{prompt}" if system_prompt else prompt
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={google_api_key}"
            payload = {
                "contents": [{"parts": [{"text": full_prompt}]}],
                "generationConfig": {"temperature": 0.3, "maxOutputTokens": 2048}
            }
            async with httpx.AsyncClient(timeout=30.0) as client:
                res = await client.post(url, json=payload)
                if res.status_code == 200:
                    return res.json()["candidates"][0]["content"]["parts"][0]["text"].strip()
                raise ValueError(f"Gemini API lỗi {res.status_code}: {res.text}")
        # 2. Hoặc dùng OpenRouter
        if openrouter_api_key:
            model = getattr(self.settings, "llm_model", "meta-llama/llama-3.2-3b-instruct:free")
            messages = []
            if system_prompt:
                messages.append({"role": "system", "content": system_prompt})
            messages.append({"role": "user", "content": prompt})
            async with httpx.AsyncClient(timeout=30.0) as client:
                res = await client.post(
                    "https://openrouter.ai/api/v1/chat/completions",
                    headers={"Authorization": f"Bearer {openrouter_api_key}", "Content-Type": "application/json"},
                    json={"model": model, "messages": messages, "temperature": 0.3}
                )
                if res.status_code == 200:
                    return res.json()["choices"][0]["message"]["content"].strip()
                raise ValueError(f"OpenRouter API lỗi {res.status_code}: {res.text}")
        raise ValueError("Chưa cấu hình API Key cho Google Gemini hoặc OpenRouter trong .env")
    # =========================================================================
    # 🔹 PHẦN 3: TÓM TẮT MAP-REDUCE (Map-Reduce Summarization)
    # =========================================================================
    async def summarize_pdf(self, pdf_content: bytes) -> Dict[str, Any]:
        """Tóm tắt văn bản PDF sử dụng thuật toán Map-Reduce cho tài liệu dài"""
        text = self.extract_text_from_pdf(pdf_content)
        if not text or len(text.strip()) < 50:
            raise ValueError("Tài liệu không đủ nội dung để tóm tắt (ít hơn 50 ký tự).")
        max_direct_length = 8000  # Nếu dưới 8000 ký tự -> Tóm tắt 1 lần trực tiếp
        if len(text) <= max_direct_length:
            logger.info("⚡ Văn bản ngắn: Tóm tắt trực tiếp trong 1 lượt (Single-pass)...")
            summary = await self._summarize_single(text)
        else:
            # MAP-REDUCE CHO TÀI LIỆU DÀI:
            logger.info("📚 Văn bản dài: Bắt đầu quy trình tóm tắt Map-Reduce...")
            # 1. Chia thành các phân đoạn (Chunks)
            chunks = self.text_splitter.split_text(text)
            logger.info(f"Đã chia tài liệu thành {len(chunks)} phân đoạn.")
            # 2. Giai đoạn MAP: Tóm tắt từng phân đoạn riêng lẻ
            chunk_summaries = []
            for i, chunk in enumerate(chunks[:12]):  # Giới hạn 12 chunk để tối ưu thời gian/token
                logger.info(f"Đang tóm tắt đoạn {i+1}/{min(len(chunks), 12)}...")
                prompt = f"Hãy tóm tắt súc tích các ý chính của đoạn văn bản pháp lý sau:\n\n{chunk}"
                system = "Bạn là trợ lý AI tóm tắt văn bản pháp luật tiếng Việt ngắn gọn, giữ lại các điều khoản quan trọng."
                sub_sum = await self._call_llm(prompt, system)
                chunk_summaries.append(sub_sum)
            # 3. Giai đoạn REDUCE: Tổng hợp tất cả các bản tóm tắt nhỏ thành bản hoàn chỉnh
            combined_summary_text = "\n\n".join(chunk_summaries)
            summary = await self._summarize_final_reduce(combined_summary_text)
        word_count = len(text.split())
        summary_word_count = len(summary.split())
        return {
            "summary": summary,
            "word_count": word_count,
            "summary_word_count": summary_word_count,
            "compression_ratio": round(word_count / max(summary_word_count, 1), 2)
        }
    async def _summarize_single(self, text: str) -> str:
        system = "Bạn là chuyên gia phân tích và tóm tắt văn bản pháp lý tiếng Việt."
        prompt = f"""Hãy tóm tắt văn bản sau đây một cách rõ ràng và chuyên nghiệp:
{text}
CẤU TRÚC BẢN TÓM TẮT BẮT BUỘC GỒM:
1. **Loại văn bản & Mục đích chính**: (Hợp đồng, quy chế, đơn từ...)
2. **Nội dung trọng tâm**: (Các điều khoản, thỏa thuận cốt lõi)
3. **Quyền & Nghĩa vụ của các bên**: (Nếu có)
4. **Hiệu lực & Chế tài vi phạm**: (Nếu có)"""
        return await self._call_llm(prompt, system)
    async def _summarize_final_reduce(self, combined_text: str) -> str:
        system = "Bạn là chuyên gia tổng hợp văn bản pháp luật cấp cao."
        prompt = f"""Dưới đây là các phần tóm tắt thành phần của một văn bản pháp lý dài:
{combined_text}
Hãy tổng hợp lại thành MỘT BẢN TÓM TẮT DUY NHẤT hoàn chỉnh, mạch lạc và súc tích theo cấu trúc:
1. **Tổng quan tài liệu & Mục đích**
2. **Các điều khoản & Quy định trọng tâm**
3. **Trách nhiệm & Ràng buộc pháp lý cần lưu ý**
4. **Thời hạn & Hiệu lực áp dụng**"""
        return await self._call_llm(prompt, system)
    # =========================================================================
    # 🔹 PHẦN 4: CHAT WITH PDF (Cô lập Vector Store theo từng PDF)
    # =========================================================================
    async def setup_pdf_qa(self, pdf_content: bytes, pdf_id: str) -> Dict[str, Any]:
        """Tạo Vector Store cô lập trên RAM/ChromaDB cho từng file PDF được upload"""
        logger.info(f"🔧 Đang thiết lập Q&A cho PDF ID: {pdf_id}")
        text = self.extract_text_from_pdf(pdf_content)
        if not text or len(text.strip()) < 50:
            raise ValueError("PDF không chứa đủ nội dung văn bản.")
        # Chia nhỏ text
        chunks = self.text_splitter.split_text(text)
        docs = [
            Document(page_content=chunk, metadata={"pdf_id": pdf_id, "chunk_id": i})
            for i, chunk in enumerate(chunks)
        ]
        # Tạo collection cô lập cho riêng file này
        vector_store = Chroma.from_documents(
            documents=docs,
            embedding=self.embeddings,
            collection_name=f"pdf_{pdf_id}"
        )
        self.pdf_stores[pdf_id] = vector_store
        logger.info(f"✅ Đã lập chỉ mục {len(chunks)} chunks cho PDF: {pdf_id}")
        return {
            "pdf_id": pdf_id,
            "chunks": len(chunks),
            "total_characters": len(text),
            "status": "ready"
        }
    async def ask_pdf(self, pdf_id: str, question: str, top_k: int = 4) -> Dict[str, Any]:
        """Trả lời câu hỏi của người dùng DỰA TRÊN CHÍNH TÀI LIỆU PDF ĐÃ TẢI LÊN"""
        # Nếu session trong RAM bị mất (ví dụ sau restart), tự khôi phục từ file đĩa cứng
        if pdf_id not in self.pdf_stores:
            content = self.get_pdf_content(pdf_id)
            if content:
                await self.setup_pdf_qa(content, pdf_id)
            else:
                raise ValueError(f"Không tìm thấy tài liệu PDF với ID '{pdf_id}'. Vui lòng tải lại file.")
        vector_store = self.pdf_stores[pdf_id]
        # 1. Truy vấn ngữ nghĩa top_k đoạn liên quan nhất
        results = vector_store.similarity_search(question, k=top_k)
        if not results:
            return {
                "answer": "Không tìm thấy thông tin liên quan đến câu hỏi trong tài liệu này.",
                "sources": [],
                "context_used": 0
            }
        context_blocks = []
        sources = []
        for i, doc in enumerate(results):
            chunk_id = doc.metadata.get("chunk_id", i)
            context_blocks.append(f"[Đoạn {i+1}]:\n{doc.page_content}")
            sources.append({
                "chunk_id": chunk_id,
                "content": doc.page_content[:250] + "..." if len(doc.page_content) > 250 else doc.page_content
            })
        context_str = "\n\n".join(context_blocks)
        # 2. Tạo Prompt ép AI trả lời đúng trên tài liệu, không tự bịa đặt
        system_prompt = """Bạn là trợ lý AI giải đáp thắc mắc dựa trên tài liệu pháp lý được người dùng cung cấp.
NGUYÊN TẮC:
- CHỈ trả lời dựa vào các đoạn văn bản được trích xuất dưới đây.
- NẾU tài liệu không đề cập đến thông tin cần hỏi, hãy trả lời thẳng thắn: "Tài liệu này không đề cập đến thông tin bạn yêu cầu."
- Trả lời bằng tiếng Việt rõ ràng, kèm trích dẫn đoạn liên quan."""
        prompt = f"""=== NỘI DUNG TRÍCH XUẤT TỪ TÀI LIỆU ===
{context_str}
=== HẾT NỘI DUNG ===
CÂU HỎI CỦA NGƯỜI DÙNG: {question}
Trả lời:"""
        answer = await self._call_llm(prompt, system_prompt)
        return {
            "answer": answer,
            "sources": sources,
            "context_used": len(results)
        }
    def clear_pdf_session(self, pdf_id: str):
        """Xóa session PDF khỏi bộ nhớ"""
        if pdf_id in self.pdf_stores:
            del self.pdf_stores[pdf_id]
            logger.info(f"Đã giải phóng bộ nhớ session PDF: {pdf_id}")
# Singleton instance
_pdf_service: Optional[PDFService] = None
def get_pdf_service() -> PDFService:
    global _pdf_service
    if _pdf_service is None:
        _pdf_service = PDFService()
    return _pdf_service