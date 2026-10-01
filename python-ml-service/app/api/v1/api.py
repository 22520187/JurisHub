from fastapi import APIRouter
from app.api.v1.endpoints import health
api_router = APIRouter()

# Tích hợp healthcheck
api_router.include_router(health.router, tags=["System Health"])