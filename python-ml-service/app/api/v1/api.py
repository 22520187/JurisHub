from fastapi import APIRouter
from app.api.v1.endpoints import health, sentiment, pdf, rag

api_router = APIRouter()

api_router.include_router(health.router, tags=["System Health"])
api_router.include_router(sentiment.router, prefix="/sentiment", tags=["Sentiment & Moderation"])
api_router.include_router(pdf.router, prefix="/pdf", tags=["PDF Document AI"])
api_router.include_router(rag.router, prefix="/rag", tags=["RAG QA"])
