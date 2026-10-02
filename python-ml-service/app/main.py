from contextlib import asynccontextmanager
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from loguru import logger
from app.core.config import get_settings
from app.core.logger import setup_logging
from app.api.v1.api import api_router
from app.api.v1.endpoints import sentiment, pdf, rag
# Thiết lập Logger
setup_logging()
settings = get_settings()
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Xử lý sự kiện khi server khởi động và dừng"""
    logger.info(f"Đang khởi động {settings.PROJECT_NAME} v{settings.VERSION}...")

    # Pre-load Sentiment Model để request đầu tiên không bị delay
    try:
        from app.services.sentiment_service import get_sentiment_service
        sentiment_svc = get_sentiment_service()
        sentiment_svc.initialize()
    except Exception as e:
        logger.error(f"Lỗi khi pre-load Sentiment model: {e}")
    
    # Tạo các thư mục lưu trữ dữ liệu nếu chưa tồn tại
    os.makedirs(settings.CHROMA_PERSIST_DIR, exist_ok=True)
    os.makedirs(settings.PDF_UPLOAD_DIR, exist_ok=True)
    os.makedirs("logs", exist_ok=True)
    
    logger.info(" Các thư mục dữ liệu đã sẵn sàng.")
    yield
    logger.info(" Đang tắt dịch vụ ML Service...")
app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Engine trí tuệ nhân tạo và Machine Learning phục vụ Legal Connect Platform",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)
# Cấu hình CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# Gắn toàn bộ router v1
app.include_router(api_router, prefix=settings.API_V1_STR)
app.include_router(sentiment.router, prefix="/sentiment", tags=["Sentiment (Legacy Route)"])
app.include_router(pdf.router, prefix="/pdf", tags=["PDF QA"])
app.include_router(rag.router, prefix="/rag", tags=["RAG QA"])
@app.get("/", summary="Root Endpoint")
async def root():
    return {
        "message": f"Chào mừng đến với {settings.PROJECT_NAME}",
        "docs": "/docs",
        "health": f"{settings.API_V1_STR}/health"
    }
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG
    )