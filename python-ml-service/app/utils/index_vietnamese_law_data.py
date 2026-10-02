import os
import sys
import json
import asyncio
from pathlib import Path
import pandas as pd
from typing import Optional
from loguru import logger

sys.path.append(str(Path(__file__).parent.parent.parent))
from app.services.rag_service import get_rag_service

def load_checkpoint(checkpoint_file: Path) -> dict:
    if not checkpoint_file.exists():
        return {"last_indexed": 0, "total_documents": 0}
    try:
        with open(checkpoint_file, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return {"last_indexed": 0, "total_documents": 0}
    
def save_checkpoint(checkpoint_file: Path, last_indexed: int, total: int):
    with open(checkpoint_file, "w", encoding="utf-8") as f:
        json.dump({"last_indexed": last_indexed, "total_documents": total}, f)
    logger.info(f" Đã lưu Checkpoint: {last_indexed}/{total} điều luật.")

async def run_indexing(batch_size: int = 50, max_docs: Optional[int] = None):
    """Đọc CSV bộ luật Việt Nam và nạp từng đợt vào ChromaDB"""
    data_dir = Path(__file__).parent.parent / "data"
    csv_path = data_dir / "vietnamese_law_corpus_combined.csv"
    checkpoint_file = data_dir / ".indexing_checkpoint.json"
    if not csv_path.exists():
        logger.warning(f"Chưa tìm thấy file CSV tại: {csv_path}")
        logger.info("Hãy chạy script tải dữ liệu trước: python -m app.utils.download_dataset")
        return
    logger.info(f" Đang đọc dữ liệu từ: {csv_path}")
    df = pd.read_csv(csv_path, encoding="utf-8")
    total_docs = len(df)
    if max_docs:
        total_docs = min(total_docs, max_docs)
        df = df.iloc[:total_docs]
    checkpoint = load_checkpoint(checkpoint_file)
    start_index = checkpoint.get("last_indexed", 0)
    logger.info(f" Tổng cộng {total_docs} điều luật. Bắt đầu từ dòng {start_index}...")
    rag_service = get_rag_service()
    for i in range(start_index, total_docs, batch_size):
        batch_df = df.iloc[i : i + batch_size]
        docs = []
        for idx, row in batch_df.iterrows():
            # Xây dựng nội dung điều luật kèm tên văn bản
            content_parts = []
            for col in df.columns:
                val = row[col]
                if pd.notna(val) and str(val).strip():
                    content_parts.append(f"{col}: {val}")
            content = "\n".join(content_parts)
            meta = {
                "doc_id": int(idx),
                "source": "Bộ luật Việt Nam (kiil-lab/vietnamese-law-corpus)",
                "title": str(row.get("title", row.get("law_id", "Văn bản pháp luật")))
            }
            docs.append({"content": content, "metadata": meta})
        # Nạp vào vector store
        await rag_service.index_documents(docs)
        save_checkpoint(checkpoint_file, min(i + batch_size, total_docs), total_docs)
    logger.info(" ĐÃ HOÀN TẤT LẬP CHỈ MỤC BỘ LUẬT VIỆT NAM VÀO CHROMADB!")
    
if __name__ == "__main__":
    asyncio.run(run_indexing(batch_size=50))