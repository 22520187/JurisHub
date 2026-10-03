from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

class QuestionRequest(BaseModel):
    pdf_id: str = Field(..., description="ID băm của file PDF")
    question: str = Field(..., min_length=2, description="Câu hỏi của người dùng về tài liệu")
    top_k: Optional[int] = Field(4, ge=1, le=10, description="Số đoạn văn bản liên quan cần truy vấn")

class PDFSourceItem(BaseModel):
    chunk_id: int
    content: str
class PDFResponse(BaseModel):
    success: bool
    message: str
    data: Optional[Dict[str, Any]] = None
    error: Optional[str] = None