from pydantic import BaseModel, Field
from typing import List, Optional

class SentimentRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=5000, description="Đoạn văn bản cần phân tích", example="Dịch vụ tư vấn rất nhiệt tình!")

class BatchSentimentRequest(BaseModel):
    texts: List[str] = Field(..., min_length=1, max_length=100, description="Danh sách các đoạn văn bản cần phân tích theo lô")

class SentimentResult(BaseModel):
    text: str
    sentiment: str = Field(..., description="'positive', 'neutral', hoặc 'negative'")
    label: str = Field(..., description="Nhãn gốc từ model BERT (vd: 1 star, 5 stars)")
    score: float = Field(..., description="Độ tin cậy của dự đoán (0.0 đến 1.0)")
    is_toxic_override: bool = Field(False, description="Đánh dấu nếu bị cưỡng chế gán nhãn do chứa từ cấm")
    matched_toxic_words: Optional[List[str]] = Field(default=None, description="Danh sách từ cấm phát hiện (nếu có)")
    timestamp: str
class BatchSentimentResponse(BaseModel):
    results: List[SentimentResult]
    total: int