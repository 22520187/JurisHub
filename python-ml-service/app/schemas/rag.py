from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

class ChatMessage(BaseModel):
    role: str = Field(..., description="'user' hoặc 'assistant'")
    content: str = Field(..., description="Nội dung tin nhắn")

class AskQuestionRequest(BaseModel):
    question: str = Field(..., min_length=3, description="Câu hỏi pháp lý của người dùng", example="Mức phạt khi đi xe máy vượt đèn đỏ là bao nhiêu?")
    top_k: Optional[int] = Field(5, ge=1, le=10, description="Số lượng điều luật liên quan cần trích xuất")
    conversation_id: Optional[str] = Field(None, description="ID phiên hội thoại (nếu có)")
    chat_history: Optional[List[ChatMessage]] = Field(None, description="Lịch sử các lượt chat trước đó để ghi nhớ ngữ cảnh")
    
class LegalSource(BaseModel):
    content: str
    metadata: Dict[str, Any]

class AskQuestionResponse(BaseModel):
    success: bool
    answer: str
    sources: Optional[List[LegalSource]] = None
    processing_time: Optional[float] = None
    model_used: Optional[str] = None
    timestamp: Optional[str] = None
    error: Optional[str] = None

class IndexDocumentItem(BaseModel):
    content: str
    metadata: Optional[Dict[str, Any]] = None

class IndexDocumentRequest(BaseModel):
    documents: List[IndexDocumentItem] = Field(..., description="Danh sách văn bản luật cần nạp vào Vector DB")

class IndexDocumentResponse(BaseModel):
    success: bool
    documents_indexed: int
    chunks_created: int
    processing_time: float
    error: Optional[str] = None

class StatusResponse(BaseModel):
    status: str
    vectorstore: Dict[str, Any]
    llm: Dict[str, Any]
    embeddings: Dict[str, Any]
    error: Optional[str] = None