from fastapi import APIRouter, HTTPException, status
from loguru import logger

from app.schemas.rag import (
    AskQuestionRequest,
    AskQuestionResponse,
    IndexDocumentRequest,
    IndexDocumentResponse,
    StatusResponse
)
from app.services.rag_service import get_rag_service

router = APIRouter()

@router.post(
    "/ask",
    response_model=AskQuestionResponse,
    summary="Hỏi đáp pháp luật bằng RAG",
    description="Truy vấn điều luật tương ứng từ ChromaDB và trả lời kèm trích dẫn nguồn"
)
async def ask_question(request: AskQuestionRequest):
    try:
        rag_service = get_rag_service()
        chat_history_list = None
        if request.chat_history:
            chat_history_list = [{"role": m.role, "content": m.content} for m in request.chat_history]
        result = await rag_service.ask_question(
            question=request.question,
            top_k=request.top_k,
            chat_history=chat_history_list
        )
        return AskQuestionResponse(**result)
    except Exception as e:
        logger.error(f"Lỗi khi xử lý RAG ask: {e}")
        error_str = str(e)
        if any(keyword in error_str for keyword in ["503", "429", "high demand", "UNAVAILABLE"]):
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Dịch vụ AI tư vấn hiện đang quá tải do lượng truy cập tăng đột biến. Vui lòng thử lại sau giây lát."
            )
        raise HTTPException(status_code=500, detail=error_str)
    
@router.post(
    "/index",
    response_model=IndexDocumentResponse,
    summary="Nạp văn bản quy phạm pháp luật vào CSDL Vector"
)
async def index_documents(request: IndexDocumentRequest):
    try:
        rag_service = get_rag_service()
        docs = [{"content": doc.content, "metadata": doc.metadata} for doc in request.documents]
        result = await rag_service.index_documents(docs)
        return IndexDocumentResponse(**result)
    except Exception as e:
        logger.error(f"Lỗi khi nạp documents: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    
@router.get("/status", response_model=StatusResponse, summary="Trạng thái hệ thống RAG")
async def get_rag_status():
    rag_service = get_rag_service()
    return await rag_service.get_status()

@router.get("/documents", summary="Xem mẫu các điều luật đã có trong CSDL")
async def get_sample_documents(limit: int = 10):
    rag_service = get_rag_service()
    return await rag_service.get_sample_documents(limit=limit)

@router.get("/health", summary="Health check cho RAG module")
async def health_check():
    return {
        "status": "healthy",
        "service": "Legal RAG Service",
        "endpoints": ["/rag/ask", "/rag/index", "/rag/status", "/rag/documents"]
    }