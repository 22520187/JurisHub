from fastapi import APIRouter
from app.api.v1.endpoints import health, sentiment

api_router = APIRouter()

# Tích hợp healthcheck
api_router.include_router(health.router, tags=["System Health"])
api_router.include_router(sentiment.router, prefix="/sentiment", tags=["Sentiment & Moderation"])