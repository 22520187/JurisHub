import os
import time
import asyncio
from datetime import datetime
from typing import List, Dict, Optional, Any
import httpx
from loguru import logger

import chromadb
from chromadb.config import Settings as ChromaSettings
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.vectorstores import Chroma

from app.core.config import get_settings

class RAGService:
    """Service RAG Pháp luật: Truy vấn điều luật từ ChromaDB và sinh lời tư vấn kèm trích dẫn"""
    def __init__(self):
        self.settings = get_settings()
        self.embeddings = None
        self.chroma_client = None
        self.vectorstore = None
        self.text_splitter = None
        self.last_model_used = None
        self._initialize()
    def _initialize(self):
        """Khởi tạo mô hình Embedding, ChromaDB và bộ tách văn bản"""
        try:
            logger.info(" Đang khởi tạo Legal RAG Service...")
            # 1. Khởi tạo Embeddings đa ngôn ngữ
            logger.info(f" Đang tải mô hình Embedding: {self.settings.EMBEDDING_MODEL}...")
            self.embeddings = HuggingFaceEmbeddings(
                model_name=self.settings.EMBEDDING_MODEL,
                model_kwargs={"device": "cpu"},
                encode_kwargs={"normalize_embeddings": True}
            )
            # 2. Khởi tạo ChromaDB Persistent Storage
            persist_dir = getattr(self.settings, "chroma_persist_dir", "./app/data/vector_stores") or getattr(self.settings, "CHROMA_PERSIST_DIR", "./app/data/vector_stores")
            collection_name = getattr(self.settings, "collection_name", "legal_documents") or getattr(self.settings, "COLLECTION_NAME", "legal_documents")
            os.makedirs(persist_dir, exist_ok=True)
            logger.info(f"📂 Kết nối ChromaDB tại thư mục: {persist_dir}")
            self.chroma_client = chromadb.PersistentClient(
                path=persist_dir,
                settings=ChromaSettings(anonymized_telemetry=False)
            )
            self.vectorstore = Chroma(
                client=self.chroma_client,
                collection_name=collection_name,
                embedding_function=self.embeddings
            )
            # 3. Bộ tách văn bản tối ưu cho văn bản pháp lý Việt Nam
            chunk_size = getattr(self.settings, "chunk_size", 1000) or getattr(self.settings, "CHUNK_SIZE", 1000)
            chunk_overlap = getattr(self.settings, "chunk_overlap", 150) or getattr(self.settings, "CHUNK_OVERLAP", 150)
            self.text_splitter = RecursiveCharacterTextSplitter(
                chunk_size=chunk_size,
                chunk_overlap=chunk_overlap,
                separators=["\n\n", "\n", "Điều ", "Khoản ", ".", " ", ""]
            )
            logger.info("✅ Legal RAG Service đã khởi tạo thành công.")
        except Exception as e:
            logger.error(f"❌ Không thể khởi tạo Legal RAG Service: {e}")
            raise
    async def _call_llm(self, prompt: str, system_prompt: str) -> str:
        """
        Gọi LLM với cơ chế High-Availability & Tự động phục hồi lỗi (Self-Healing Fallback):
        1. Thử gọi mô hình cấu hình (ví dụ: gemini-3.8-flash)
        2. Tự động Retry sau 1.5s khi gặp lỗi tải cao tạm thời (HTTP 503) hoặc Rate Limit (HTTP 429)
        3. Tự động Fallback chuyển sang các mô hình dự phòng (gemini-flash-latest, gemini-flash-lite-latest, gemini-3.5-flash-lite, gemini-3.1-flash-lite, gemini-3.6-flash)
        4. Fallback sang OpenRouter nếu có cấu hình API Key
        """
        provider = getattr(self.settings, "llm_provider", "google").lower()
        google_api_key = getattr(self.settings, "google_api_key", "") or getattr(self.settings, "GOOGLE_API_KEY", "")
        openrouter_api_key = getattr(self.settings, "openrouter_api_key", "") or getattr(self.settings, "OPENROUTER_API_KEY", "")

        errors = []

        # 1. Thử Google Gemini với danh sách Model Fallback Chain
        if google_api_key and (provider == "google" or not openrouter_api_key):
            primary_model = getattr(self.settings, "llm_model", "gemini-3.8-flash") or "gemini-3.8-flash"
            if primary_model in ["gemini-pro", "gemini-1.5-flash"]:
                primary_model = "gemini-3.8-flash"

            fallback_models = [
                primary_model,
                "gemini-flash-latest",
                "gemini-flash-lite-latest",
                "gemini-3.5-flash-lite",
                "gemini-3.1-flash-lite",
                "gemini-3.6-flash"
            ]
            # Loại bỏ trùng lặp giữ nguyên thứ tự
            candidate_models = list(dict.fromkeys(fallback_models))

            full_prompt = f"{system_prompt}\n\n{prompt}"
            payload = {
                "contents": [{"parts": [{"text": full_prompt}]}],
                "generationConfig": {"temperature": 0.2, "maxOutputTokens": 2048}
            }

            async with httpx.AsyncClient(timeout=35.0) as client:
                for idx, model in enumerate(candidate_models):
                    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={google_api_key}"
                    
                    # Model chính được phép retry 1 lần nếu gặp lỗi tải cao 503 / 429
                    max_attempts = 2 if idx == 0 else 1
                    for attempt in range(max_attempts):
                        try:
                            logger.info(f"🤖 [LLM CALL] Gửi yêu cầu tới Gemini model '{model}' (Lần {attempt + 1}/{max_attempts})...")
                            res = await client.post(url, json=payload)
                            
                            if res.status_code == 200:
                                self.last_model_used = model
                                answer = res.json()["candidates"][0]["content"]["parts"][0]["text"].strip()
                                if idx > 0:
                                    logger.success(f"✅ [FALLBACK SUCCESS] Đã sinh câu trả lời thành công bằng model dự phòng: {model}")
                                return answer
                            
                            # Quá tải tạm thời (503), Rate limit (429), hoặc lỗi server (500, 502, 504)
                            if res.status_code in [503, 429, 500, 502, 504]:
                                logger.warning(
                                    f"⚠️ [GEMINI SPIKE] Model '{model}' phản hồi HTTP {res.status_code}: Quá tải tạm thời / Rate limit. "
                                    f"Đang chuẩn bị {'thử lại...' if attempt < max_attempts - 1 else 'chuyển sang model dự phòng tiếp theo...'}"
                                )
                                errors.append(f"{model} (HTTP {res.status_code})")
                                if attempt < max_attempts - 1:
                                    await asyncio.sleep(1.5)
                                    continue
                                break
                            else:
                                logger.warning(f"⚠️ Model '{model}' lỗi HTTP {res.status_code}: {res.text[:120]}")
                                errors.append(f"{model} (HTTP {res.status_code})")
                                break

                        except (httpx.TimeoutException, httpx.NetworkError) as net_err:
                            logger.warning(f"⚠️ Kết nối model '{model}' bị timeout/network error: {net_err}")
                            errors.append(f"{model} ({type(net_err).__name__})")
                            if attempt < max_attempts - 1:
                                await asyncio.sleep(1.5)
                                continue
                            break
                        except Exception as e:
                            logger.warning(f"⚠️ Ngoại lệ khi gọi model '{model}': {e}")
                            errors.append(f"{model} ({str(e)})")
                            break

        # 2. Thử OpenRouter nếu có cấu hình
        if openrouter_api_key:
            logger.info("🔄 [PROVIDER FALLBACK] Đang chuyển sang OpenRouter...")
            model = getattr(self.settings, "openrouter_model", "meta-llama/llama-3.2-3b-instruct:free")
            messages = [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": prompt}
            ]
            try:
                async with httpx.AsyncClient(timeout=35.0) as client:
                    res = await client.post(
                        "https://openrouter.ai/api/v1/chat/completions",
                        headers={"Authorization": f"Bearer {openrouter_api_key}", "Content-Type": "application/json"},
                        json={"model": model, "messages": messages, "temperature": 0.2}
                    )
                    if res.status_code == 200:
                        self.last_model_used = f"openrouter/{model}"
                        return res.json()["choices"][0]["message"]["content"].strip()
                    errors.append(f"OpenRouter (HTTP {res.status_code})")
            except Exception as e:
                errors.append(f"OpenRouter ({str(e)})")

        error_summary = "; ".join(errors) if errors else "Không rõ nguyên nhân"
        raise ValueError(f"Không thể kết nối đến bất kỳ mô hình AI nào. Các lỗi ghi nhận: {error_summary}")

    async def ask_question(
        self,
        question: str,
        top_k: Optional[int] = None,
        chat_history: Optional[List[Dict[str, str]]] = None
    ) -> Dict[str, Any]:
        """Xử lý câu hỏi RAG: Tìm kiếm điều luật và sinh câu trả lời có trích dẫn"""
        start_time = time.time()
        k = top_k or getattr(self.settings, "top_k", 5) or getattr(self.settings, "TOP_K", 5)
        logger.info(f"🔍 [RAG QUERY] Đang xử lý câu hỏi: '{question}' (top_k={k})")
        # 1. Truy vấn vector tương đồng từ ChromaDB
        search_results = self.vectorstore.similarity_search(question, k=k)
        # Định dạng ngữ cảnh văn bản luật trích xuất được
        context_parts = []
        sources = []
        for i, doc in enumerate(search_results):
            source_meta = doc.metadata or {}
            title = source_meta.get("title", source_meta.get("source", f"Văn bản pháp luật #{i+1}"))
            context_parts.append(f"--- [TÀI LIỆU {i+1}: {title}] ---\n{doc.page_content}")
            sources.append({
                "content": doc.page_content[:250] + "..." if len(doc.page_content) > 250 else doc.page_content,
                "metadata": source_meta
            })
        context_str = "\n\n".join(context_parts) if context_parts else "Không tìm thấy văn bản phù hợp trong CSDL."
        # 2. Xây dựng ngữ cảnh hội thoại trước đó (Conversation Memory)
        history_context = ""
        if chat_history and len(chat_history) > 0:
            history_context = "=== LỊCH SỬ HỘI THOẠI TRƯỚC ĐÓ ===\n"
            for msg in chat_history[-4:]:  # Lấy 4 lượt chat gần nhất
                sender = "Người dùng" if msg.get("role", "").lower() in ["user", "human"] else "Trợ lý Luật"
                history_context += f"{sender}: {msg.get('content', '')}\n"
            history_context += "=== HẾT LỊCH SỬ ===\n\n"
        # 3. System Prompt chống bịa đặt (Anti-Hallucination) & Ép trích dẫn điều luật
        system_prompt = """Bạn là Luật sư AI chuyên gia tư vấn pháp luật Việt Nam của nền tảng Legal Connect.
Nhiệm vụ của bạn là giải đáp thắc mắc pháp lý của người dùng một cách chính xác, chuyên nghiệp và có căn cứ.
QUY TẮC CỐT LÕI (BẮT BUỘC TUÂN THỦ):
1. CĂN CỨ PHÁP LÝ: BẮT BUỘC dựa vào các văn bản pháp luật được cung cấp trong phần 'VĂN BẢN PHÁP LUẬT ĐƯỢC CUNG CẤP'.
2. TRÍCH DẪN RÕ RÀNG: Trong câu trả lời, phải chỉ rõ: "Căn cứ theo [Tên Luật/Nghị định], Điều X, Khoản Y...". Nếu có mức phạt tiền hoặc hình phạt cụ thể, hãy nêu rõ ràng.
3. KHÔNG TỰ SUY DIỄN: Nếu trong các văn bản được cung cấp KHÔNG có thông tin giải đáp câu hỏi, hãy nói rõ: "Trong kho dữ liệu hiện tại chưa có điều khoản điều chỉnh trực tiếp trường hợp này" và đưa ra lời khuyên người dùng nên tìm luật sư hỗ trợ thêm.
4. ĐỊNH DẠNG: Trình bày mạch lạc, dùng Markdown (gạch đầu dòng, in đậm các điều khoản quan trọng)."""
        user_prompt = f"""{history_context}=== VĂN BẢN PHÁP LUẬT ĐƯỢC CUNG CẤP ===
{context_str}
=== HẾT VĂN BẢN ===
CÂU HỎI CỦA NGƯỜI DÙNG: {question}
Hãy đưa ra câu trả lời chi tiết và trích dẫn điều luật cụ thể:"""
        # 4. Gọi LLM sinh câu trả lời với cơ chế cứu cánh tự động (Graceful Degradation)
        try:
            answer = await self._call_llm(user_prompt, system_prompt)
            model_used = getattr(self, "last_model_used", None) or getattr(self.settings, "llm_model", "gemini-3.8-flash")
        except Exception as e:
            logger.error(f"❌ Toàn bộ mô hình LLM gặp sự cố: {e}")
            if sources:
                logger.info("🛡️ Kích hoạt chế độ cứu cánh (Graceful Degradation): Trả về căn cứ luật trích xuất từ ChromaDB")
                answer = (
                    "⚠️ **Thông báo:** Máy chủ AI hiện đang chịu tải cao đột biến nên chưa thể tổng hợp câu trả lời tự động.\n\n"
                    "Dưới đây là các **văn bản và điều khoản pháp luật trích xuất trực tiếp từ Cơ sở dữ liệu Pháp lý** liên quan đến câu hỏi của bạn:\n\n"
                )
                for i, s in enumerate(sources):
                    doc_meta = s.get("metadata", {})
                    title = doc_meta.get("title", doc_meta.get("source", f"Văn bản pháp luật #{i+1}"))
                    answer += f"### {i+1}. {title}\n{s.get('content', '')}\n\n"
                answer += "\n*Bạn có thể tham khảo trực tiếp các điều luật trên hoặc bấm gửi lại câu hỏi sau giây lát.*"
                model_used = "chromadb-direct-fallback"
            else:
                raise

        processing_time = round(time.time() - start_time, 2)
        logger.info(f"✅ [RAG SUCCESS] Đã trả lời trong {processing_time}s (Model: {model_used})")
        return {
            "success": True,
            "answer": answer,
            "sources": sources,
            "processing_time": processing_time,
            "model_used": model_used,
            "timestamp": datetime.utcnow().isoformat()
        }
    async def index_documents(self, documents: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Nạp danh sách văn bản luật vào ChromaDB"""
        start_time = time.time()
        logger.info(f"📥 Đang nạp {len(documents)} văn bản vào Vector Database...")
        texts = []
        metadatas = []
        for doc in documents:
            content = doc.get("content", "")
            meta = doc.get("metadata", {}) or {}
            if not content.strip():
                continue
            chunks = self.text_splitter.split_text(content)
            for i, chunk in enumerate(chunks):
                texts.append(chunk)
                chunk_meta = meta.copy()
                chunk_meta["chunk_index"] = i
                chunk_meta["total_chunks"] = len(chunks)
                metadatas.append(chunk_meta)
        if texts:
            # Nạp theo từng đợt 100 chunks để tránh tràn RAM
            batch_size = 100
            for i in range(0, len(texts), batch_size):
                self.vectorstore.add_texts(
                    texts=texts[i:i + batch_size],
                    metadatas=metadatas[i:i + batch_size]
                )
        duration = round(time.time() - start_time, 2)
        logger.info(f"✅ Đã lập chỉ mục thành công {len(texts)} chunks trong {duration}s")
        return {
            "success": True,
            "documents_indexed": len(documents),
            "chunks_created": len(texts),
            "processing_time": duration
        }
    async def get_status(self) -> Dict[str, Any]:
        """Lấy thông tin trạng thái cơ sở dữ liệu Vector"""
        try:
            count = self.vectorstore._collection.count()
            return {
                "status": "ready",
                "vectorstore": {
                    "type": "ChromaDB",
                    "collection": getattr(self.settings, "collection_name", "legal_documents"),
                    "document_count": count
                },
                "llm": {
                    "provider": getattr(self.settings, "llm_provider", "google"),
                    "model": getattr(self.settings, "llm_model", "gemini-3.8-flash")
                },
                "embeddings": {
                    "model": getattr(self.settings, "embedding_model", "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2")
                }
            }
        except Exception as e:
            return {"status": "error", "error": str(e)}
    async def get_sample_documents(self, limit: int = 10) -> Dict[str, Any]:
        """Lấy danh sách các chủ đề mẫu đang có trong Vector Store"""
        try:
            collection = self.vectorstore._collection
            count = collection.count()
            if count == 0:
                return {"success": True, "total_documents": 0, "sample_documents": []}
            results = collection.get(limit=limit, include=["metadatas", "documents"])
            samples = []
            for i, text in enumerate(results.get("documents", [])):
                samples.append({
                    "preview": text[:200] + "...",
                    "metadata": results["metadatas"][i] if results.get("metadatas") else {}
                })
            return {
                "success": True,
                "total_documents": count,
                "sample_documents": samples
            }
        except Exception as e:
            return {"success": False, "error": str(e)}
# Singleton instance
_rag_service: Optional[RAGService] = None
def get_rag_service() -> RAGService:
    global _rag_service
    if _rag_service is None:
        _rag_service = RAGService()
    return _rag_service