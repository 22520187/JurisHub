import json
import re
from datetime import datetime
from typing import List, Dict, Any, Optional
import httpx
import torch
from transformers import pipeline
from loguru import logger
from pydantic import BaseModel

from app.core.config import get_settings


class SentimentResult(BaseModel):
    text: str
    sentiment: str
    label: str
    score: float
    is_toxic_override: bool = False
    matched_toxic_words: Optional[List[str]] = None
    timestamp: str


class SentimentService:
    """Service kiểm duyệt nội dung tích hợp Phễu lọc & Google Gemini AI"""

    def __init__(self):
        self.settings = get_settings()
        self.model_name = "nlptown/bert-base-multilingual-uncased-sentiment"
        self.classifier = None

        # -----------------------------------------------------------------
        # TẦNG 1: TỪ TỤC TĨU & CỤM TỪ MIỆT THỊ TRỰC DIỆN (Chặn ngay - 0 Token)
        # Bắt dính ngay: "đồ con chó", "mày là chó", "óc chó", "mất dạy"...
        # -----------------------------------------------------------------
        self.hard_profanity_words = [
            # Tục tĩu thuần túy
            r"\bđ[m|k|c]m?\b", r"\bvcl\b", r"\bvcll\b", r"\bđéo\b", r"\blồn\b",
            r"\bcặc\b", r"\bbuồi\b", r"\bđụ\b", r"\bmẹ mày\b",

            # Cụm từ thóa mạ trực diện
            r"\b(chó\s+(đẻ|chết|má|thiến|dại))\b",
            r"\bóc\s+chó\b",
            r"\b(mất\s+dạy|vô\s+học|khốn\s+nạn|khốn\s+kiếp)\b",
            r"\b(ngu\s+(học|si|xuẩn|dốt|ngục|vãi))\b",
            r"\b(cút\s+(đi|ngay|xéo|mẹ|khỏi))\b"
        ]
        self.hard_profanity_regex = re.compile(
            r"(?i)(" + "|".join(self.hard_profanity_words) + r")"
        )

        # -----------------------------------------------------------------
        # TẦNG 2: CÁC TỪ ĐA NGHĨA CẦN GEMINI PHÂN XỬ (Khi không dính Tầng 1)
        # Ví dụ: "con chó cắn", "nuôi chó", "bị lừa đảo", "trứng cút"
        # -----------------------------------------------------------------
        self.suspicious_words = [
            "chó", "cút", "ngu", "dốt", "khùng", "điên", "đĩ",
            "lừa đảo", "súc vật", "láo", "đần"
        ]
        pattern = r"(?i)\b(" + "|".join(re.escape(w) for w in self.suspicious_words) + r")\b"
        self.suspicious_regex = re.compile(pattern)

    def initialize(self):
        """Khởi tạo pipeline BERT chạy offline trên máy (0 token)"""
        if self.classifier is not None:
            return
        try:
            logger.info(f"Đang tải mô hình Local BERT: {self.model_name}...")
            device = 0 if torch.cuda.is_available() else -1
            self.classifier = pipeline(
                "sentiment-analysis",
                model=self.model_name,
                device=device,
                truncation=True,
                max_length=512
            )
            logger.info(" Tải Local BERT thành công.")
        except Exception as e:
            logger.error(f" Không thể khởi tạo Local BERT: {e}")
            raise

    def _is_quoting_context(self, text: str) -> bool:
        """Kiểm tra câu trích dẫn để hỏi kiện tụng"""
        quote_indicators = [
            "chửi tôi là", "nói tôi là", "bảo tôi là", "nhục mạ tôi",
            "xúc phạm tôi", "có kiện được không", "tội làm nhục"
        ]
        text_lower = text.lower()
        return any(ind in text_lower for ind in quote_indicators) or ('"' in text) or ("'" in text)

    async def _call_gemini_moderator(self, text: str) -> Dict[str, Any]:
        """TẦNG 3: Gọi Google Gemini API chính thức"""
        google_api_key = getattr(self.settings, "google_api_key", "") or getattr(self.settings, "GOOGLE_API_KEY", "")
        model = getattr(self.settings, "llm_model", "gemini-3.8-flash") or getattr(self.settings, "LLM_MODEL", "gemini-3.8-flash")

        if not google_api_key:
            logger.error(" Chưa cấu hình GOOGLE_API_KEY trong file .env!")
            return {"sentiment": "neutral", "is_violation": False, "reason": "No Google API key"}

        logger.info(f" [GEMINI] Đang dùng Google Gemini ({model}) kiểm duyệt: \"{text}\"")

        prompt = f"""Bạn là chuyên viên kiểm duyệt nội dung của Diễn đàn Pháp luật Việt Nam.
Nhiệm vụ: Xác định nội dung có VI PHẠM (chửi bới, lăng mạ, miệt thị) hay HỢP LỆ (tai nạn bị chó cắn, bị lừa đảo, hỏi kiện tụng, ăn uống).

QUY TẮC:
- Bắt buộc trả về DUY NHẤT một chuỗi JSON hợp lệ theo định dạng:
{{"sentiment": "negative"|"neutral"|"positive", "is_violation": true|false, "reason": "giải thích ngắn gọn"}}

Nội dung cần phân tích:
\"\"\"{text}\"\"\""""

        fallback_models = [
            model,
            "gemini-flash-latest",
            "gemini-flash-lite-latest",
            "gemini-3.5-flash-lite",
            "gemini-3.1-flash-lite"
        ]
        candidate_models = list(dict.fromkeys(fallback_models))

        payload = {
            "contents": [
                {
                    "parts": [{"text": prompt}]
                }
            ],
            "generationConfig": {
                "temperature": 0.3,
                "maxOutputTokens": 2048
            }
        }

        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                for candidate in candidate_models:
                    url = f"https://generativelanguage.googleapis.com/v1beta/models/{candidate}:generateContent?key={google_api_key}"
                    res = await client.post(url, json=payload, headers={"Content-Type": "application/json"})
                    if res.status_code == 200:
                        data = res.json()
                        raw_text = data["candidates"][0]["content"]["parts"][0]["text"]
                        match = re.search(r"\{.*?\}", raw_text, re.DOTALL)
                        if match:
                            return json.loads(match.group())
                    elif res.status_code in [503, 429]:
                        logger.warning(f"⚠️ [SENTIMENT GEMINI SPIKE] Model '{candidate}' quá tải (HTTP {res.status_code}). Đang chuyển model dự phòng...")
                        continue
                    else:
                        logger.warning(f"⚠️ Model '{candidate}' lỗi HTTP {res.status_code}. Thử model tiếp theo...")
                        continue
        except Exception as e:
            logger.error(f"❌ Exception khi gọi Google Gemini: {e}")

        return {"sentiment": "neutral", "is_violation": False, "reason": "Fallback mode"}

    async def analyze_text(self, text: str) -> SentimentResult:
        """Phân tích văn bản qua cơ chế Phễu lọc 3 tầng"""
        clean_text = text.strip()
        if not clean_text:
            return SentimentResult(
                text=text, sentiment="neutral", label="clean", score=1.0,
                is_toxic_override=False, timestamp=datetime.utcnow().isoformat()
            )

        # -------------------------------------------------------------
        # TẦNG 1: BẮT NHANH TỪ TỤC TĨU & CỤM MIỆT THỊ (Tốn 0 token - 0.1ms)
        # Câu "Mày là đồ con chó" sẽ bị tóm ngay tại đây!
        # -------------------------------------------------------------
        profane_matches = self.hard_profanity_regex.findall(clean_text)
        if profane_matches and not self._is_quoting_context(clean_text):
            matched_words = []
            for m in profane_matches:
                w = m[0] if isinstance(m, tuple) else m
                if w:
                    matched_words.append(w.strip().lower())
            words = list(set(matched_words))

            logger.warning(f"🛑 [Tầng 1 - 0 Token] Bắt thô tục/xúc phạm: {words}")
            return SentimentResult(
                text=text,
                sentiment="negative",
                label="violation",
                score=0.99,
                is_toxic_override=True,
                matched_toxic_words=words if words else ["Xúc phạm người khác"],
                timestamp=datetime.utcnow().isoformat()
            )

        # -------------------------------------------------------------
        # TẦNG 2: NẾU KHÔNG CÓ TỪ NHẠY CẢM -> LOCAL BERT (0 token!)
        # -------------------------------------------------------------
        suspicious_matches = self.suspicious_regex.findall(clean_text.lower())
        if not suspicious_matches:
            if not self.classifier:
                self.initialize()

            result = self.classifier(clean_text)[0]
            label = result["label"]
            score = float(result["score"])
            sentiment = "positive" if label in ["4 stars", "5 stars"] else "neutral"

            logger.info(f"⚡ [Tầng 2 - 0 Token - Local BERT] Phân loại: {sentiment}")
            return SentimentResult(
                text=text, sentiment=sentiment, label=label, score=round(score, 4),
                is_toxic_override=False, matched_toxic_words=None,
                timestamp=datetime.utcnow().isoformat()
            )

        # -------------------------------------------------------------
        # TẦNG 3: CÓ TỪ NHẠY CẢM -> GỌI GOOGLE GEMINI PHÂN XỬ
        # (Chỉ gọi khi gặp ca phân vân như "Tôi bị con chó cắn", "Trứng cút")
        # -------------------------------------------------------------
        logger.info(f"🤖 [Tầng 3 - Kích hoạt Gemini] Phân xử từ nhạy cảm {suspicious_matches} trong: '{clean_text[:40]}...'")
        gemini_data = await self._call_gemini_moderator(clean_text)

        is_violation = gemini_data.get("is_violation", False)
        sentiment = "negative" if is_violation else gemini_data.get("sentiment", "neutral")
        reason = gemini_data.get("reason", "Phân tích ngữ cảnh bởi Gemini")

        return SentimentResult(
            text=text,
            sentiment=sentiment,
            label="violation" if is_violation else "legitimate_post",
            score=0.95,
            is_toxic_override=is_violation,
            matched_toxic_words=[reason] if is_violation else None,
            timestamp=datetime.utcnow().isoformat()
        )

    async def analyze_batch(self, texts: List[str]) -> List[SentimentResult]:
        import asyncio
        tasks = [self.analyze_text(text) for text in texts]
        return await asyncio.gather(*tasks)


_sentiment_service: Optional[SentimentService] = None


def get_sentiment_service() -> SentimentService:
    global _sentiment_service
    if _sentiment_service is None:
        _sentiment_service = SentimentService()
    return _sentiment_service
