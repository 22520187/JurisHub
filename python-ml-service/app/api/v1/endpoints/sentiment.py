from fastapi import APIRouter, Depends, HTTPException, status
from loguru import logger

from app.schemas.sentiment import (
    SentimentRequest,
    SentimentResult,
    BatchSentimentRequest,
    BatchSentimentResponse
)
from app.services.sentiment_service import get_sentiment_service, SentimentService
router = APIRouter()

@router.post("/analyze", response_model=SentimentResult, 
             summary="Phân tích cảm xúc & kiểm duyệt 1 văn bản", 
             description="Dùng để kiểm duyệt nội dung bài đăng hoặc bình luận từ Spring Boot hoặc Frontend"
)
async def analyze_sentiment(
    request: SentimentRequest,
    service: SentimentService = Depends(get_sentiment_service)
):
    try:
        result = await service.analyze_text(request.text)
        return result
    except Exception as e:
        logger.error(f"Lỗi khi phân tích cảm xúc: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Lỗi hệ thống khi phân tích cảm xúc: {str(e)}"
        )

@router.post(
    "/analyze-batch",
    response_model=BatchSentimentResponse,
    summary="Phân tích cảm xúc hàng loạt",
    description="Dùng khi cần kiểm duyệt nhiều bài đăng/bình luận cùng lúc"
)
async def analyze_batch(
    request: BatchSentimentRequest,
    service: SentimentService = Depends(get_sentiment_service)
):
    try:
        results = service.analyze_batch(request.texts)
        return BatchSentimentResponse(results=results, total=len(results))
    except Exception as e:
        logger.error(f"Lỗi khi phân tích hàng loạt: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Lỗi hệ thống khi phân tích hàng loạt: {str(e)}"
        )