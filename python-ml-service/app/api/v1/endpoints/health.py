import time
import psutil
from fastapi import APIRouter
from app.core.config import get_settings

router = APIRouter()
settings = get_settings()
START_TIME = time.time()

@router.get("/health", summary="Kiểm tra trạng thái hệ thống")
async def health_check():
    """Endpoint trả về uptime, RAM, CPU và thông số model cơ bản"""
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "environment": settings.ENVIRONMENT,
        "uptime_seconds": round(time.time() - START_TIME, 2),
        "system_metrics": {
            "cpu_percent": psutil.cpu_percent(),
            "ram_percent": psutil.virtual_memory().percent,
        },
        "config": {
            "llm_provider": settings.LLM_PROVIDER,
            "llm_model": settings.LLM_MODEL,
            "embedding_model": settings.EMBEDDING_MODEL,
        }
    }