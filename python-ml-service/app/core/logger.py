import sys
from loguru import logger
from app.core.config import get_settings

settings = get_settings()

def setup_logging():
    """Khởi tạo logger định dạng màu sắc cho console và ghi file log"""
    logger.remove()  # Xóa cấu hình logging mặc định của loguru

    #Log ra console
    logger.add(
        sys.stdout,
        colorize=True,
        format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - <level>{message}</level>",
        level="DEBUG" if settings.DEBUG else "INFO",
    )

    # Log vào File (tự động rotate khi file đạt 10MB)
    logger.add(
        "logs/app.log",
        rotation="10 MB",
        retention="14 days",
        compression="zip",
        level="INFO",
        encoding="utf-8",
    )
    return logger