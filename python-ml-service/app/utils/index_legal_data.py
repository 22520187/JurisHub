#!/usr/bin/env python3
"""
Index Legal Documents into ChromaDB Vector Store
Source: 
1. frontend/public/50_dataset_van_ban_phap_luat.csv
2. Key Vietnamese Traffic & Civil Regulations Seed (Nghị định 100/2019/NĐ-CP & 123/2021/NĐ-CP, Bộ luật Lao động, Luật Doanh nghiệp)
"""

import os
import sys
import asyncio
from pathlib import Path
import pandas as pd
from loguru import logger

# Add paths for both 'app' and root workspace
sys.path.append(str(Path(__file__).parent.parent))
sys.path.append(str(Path(__file__).parent.parent.parent))

try:
    from app.services.rag_service import get_rag_service
except ImportError:
    from services.rag_service import get_rag_service


# Danh sách văn bản pháp luật trọng điểm thường gặp (Giao thông, Lao động, Doanh nghiệp)
COMMON_LAW_SEEDS = [
    {
        "title": "Nghị định 100/2019/NĐ-CP (sửa đổi bởi Nghị định 123/2021/NĐ-CP) - Xử phạt vi phạm giao thông đường bộ",
        "so_hieu": "100/2019/NĐ-CP",
        "loai_van_ban": "Nghị định",
        "noi_ban_hanh": "Chính phủ",
        "ngay_ban_hanh": "30/12/2019",
        "content": """Điều 5. Xử phạt người điều khiển xe ô tô và các loại xe tương tự xe ô tô vi phạm quy tắc giao thông đường bộ
1. Phạt tiền từ 4.000.000 đồng đến 6.000.000 đồng đối với người điều khiển xe thực hiện hành vi vi phạm:
a) Không chấp hành hiệu lệnh của đèn tín hiệu giao thông (vượt đèn đỏ hoặc vượt đèn vàng trái quy định).
2. Hình thức xử phạt bổ sung:
b) Thực hiện hành vi quy định tại điểm a khoản 5 Điều này bị tước quyền sử dụng Giấy phép lái xe từ 01 tháng đến 03 tháng. Trường hợp không chấp hành hiệu lệnh của đèn tín hiệu giao thông mà gây tai nạn giao thông thì bị tước quyền sử dụng Giấy phép lái xe từ 02 tháng đến 04 tháng."""
    },
    {
        "title": "Nghị định 100/2019/NĐ-CP (sửa đổi bởi Nghị định 123/2021/NĐ-CP) - Xử phạt xe mô tô, xe gắn máy vượt đèn đỏ",
        "so_hieu": "100/2019/NĐ-CP",
        "loai_van_ban": "Nghị định",
        "noi_ban_hanh": "Chính phủ",
        "ngay_ban_hanh": "30/12/2019",
        "content": """Điều 6. Xử phạt người điều khiển xe mô tô, xe gắn máy (kể cả xe máy điện), các loại xe tương tự xe mô tô và các loại xe tương tự xe gắn máy vi phạm quy tắc giao thông đường bộ
Phạt tiền từ 800.000 đồng đến 1.000.000 đồng đối với người điều khiển xe thực hiện hành vi không chấp hành hiệu lệnh của đèn tín hiệu giao thông (vượt đèn đỏ, vượt đèn vàng).
Hình thức phạt bổ sung: Bị tước quyền sử dụng Giấy phép lái xe từ 01 tháng đến 03 tháng."""
    },
    {
        "title": "Bộ luật Lao động năm 2019 - Quyền đơn phương chấm dứt hợp đồng lao động của người lao động",
        "so_hieu": "45/2019/QH14",
        "loai_van_ban": "Luật",
        "noi_ban_hanh": "Quốc hội",
        "ngay_ban_hanh": "20/11/2019",
        "content": """Điều 35. Quyền đơn phương chấm dứt hợp đồng lao động của người lao động
1. Người lao động có quyền đơn phương chấm dứt hợp đồng lao động nhưng phải báo trước cho người sử dụng lao động:
a) Ít nhất 45 ngày nếu làm việc theo hợp đồng lao động không xác định thời hạn;
b) Ít nhất 30 ngày nếu làm việc theo hợp đồng lao động xác định thời hạn có thời hạn từ 12 tháng đến 36 tháng;
c) Ít nhất 03 ngày làm việc nếu làm việc theo hợp đồng lao động xác định thời hạn có thời hạn dưới 12 tháng."""
    }
]


async def index_legal_documents():
    """Index legal documents from CSV file and common core regulations"""
    
    # Path to CSV file in frontend/public
    csv_path = Path(__file__).parent.parent.parent.parent / "frontend" / "public" / "50_dataset_van_ban_phap_luat.csv"
    
    rag_service = get_rag_service()
    documents = []

    # 1. Thêm bộ luật cốt lõi (Giao thông đường bộ, Lao động...)
    logger.info("📚 Đang nạp các văn bản quy phạm pháp luật trọng điểm (Giao thông, Lao động)...")
    for idx, item in enumerate(COMMON_LAW_SEEDS):
        documents.append({
            "content": f"TÊN VĂN BẢN: {item['title']}\nSỐ HIỆU: {item['so_hieu']}\nLOẠI VĂN BẢN: {item['loai_van_ban']}\nNƠI BAN HÀNH: {item['noi_ban_hanh']}\nNỘI DUNG:\n{item['content']}",
            "metadata": {
                "source": "common_laws_seed",
                "title": item["title"],
                "so_hieu": item["so_hieu"],
                "loai_van_ban": item["loai_van_ban"],
                "noi_ban_hanh": item["noi_ban_hanh"],
                "ngay_ban_hanh": item["ngay_ban_hanh"]
            }
        })
    
    # 2. Đọc file CSV 50 văn bản pháp luật nếu tồn tại
    if csv_path.exists():
        logger.info(f"📂 Đang đọc dữ liệu pháp luật từ: {csv_path}")
        try:
            df = pd.read_csv(csv_path, encoding='utf-8')
            logger.info(f"Loaded {len(df)} documents from CSV. Columns: {df.columns.tolist()}")
            
            for idx, row in df.iterrows():
                title = str(row.get("title", "")).strip()
                so_hieu = str(row.get("so_hieu", "")).strip()
                raw_content = str(row.get("cleaned_content", row.get("full_text_for_embedding", ""))).strip()
                
                content_parts = []
                if title:
                    content_parts.append(f"TÊN VĂN BẢN: {title}")
                if so_hieu:
                    content_parts.append(f"SỐ HIỆU: {so_hieu}")
                if pd.notna(row.get("loai_van_ban")):
                    content_parts.append(f"LOẠI VĂN BẢN: {row['loai_van_ban']}")
                if pd.notna(row.get("noi_ban_hanh")):
                    content_parts.append(f"NƠI BAN HÀNH: {row['noi_ban_hanh']}")
                if pd.notna(row.get("ngay_ban_hanh")):
                    content_parts.append(f"NGÀY BAN HÀNH: {row['ngay_ban_hanh']}")
                
                if raw_content:
                    content_parts.append(f"NỘI DUNG:\n{raw_content}")
                else:
                    for col in df.columns:
                        val = row[col]
                        if pd.notna(val) and str(val).strip():
                            content_parts.append(f"{col}: {val}")
                
                content = "\n".join(content_parts)
                
                metadata = {
                    "doc_index": int(idx),
                    "source": "50_dataset_van_ban_phap_luat.csv",
                    "title": title or f"Văn bản pháp luật #{idx+1}",
                    "so_hieu": so_hieu,
                    "loai_van_ban": str(row.get("loai_van_ban", "")),
                    "noi_ban_hanh": str(row.get("noi_ban_hanh", "")),
                    "ngay_ban_hanh": str(row.get("ngay_ban_hanh", "")),
                    "link": str(row.get("link", ""))
                }
                
                documents.append({
                    "content": content,
                    "metadata": metadata
                })
        except Exception as e:
            logger.error(f"❌ Lỗi khi đọc file CSV: {e}")
    else:
        logger.warning(f"⚠️ Không tìm thấy file CSV tại: {csv_path}")

    logger.info(f"Tổng số văn bản chuẩn bị nạp vào ChromaDB: {len(documents)}")
    
    # 3. Nạp tài liệu vào ChromaDB theo từng batch
    batch_size = 10
    total_chunks = 0
    
    for i in range(0, len(documents), batch_size):
        batch = documents[i:i + batch_size]
        batch_num = i // batch_size + 1
        total_batches = (len(documents) + batch_size - 1) // batch_size
        logger.info(f"⏳ Đang lập chỉ mục batch {batch_num}/{total_batches} ({len(batch)} văn bản)...")
        
        result = await rag_service.index_documents(batch)
        if result.get("success"):
            chunks = result.get("chunks_created", 0)
            total_chunks += chunks
            logger.info(f"✅ Batch {batch_num} hoàn thành: {chunks} chunks")
        else:
            logger.error(f"❌ Batch {batch_num} thất bại: {result.get('error')}")
    
    logger.info(f"""
╔══════════════════════════════════════════════════════╗
║           INDEXING COMPLETED SUCCESSFULLY            ║
╠══════════════════════════════════════════════════════╣
║  Documents processed: {len(documents):>30} ║
║  Total chunks created: {total_chunks:>29} ║
║  Status: {'SUCCESS':>38} ║
╚══════════════════════════════════════════════════════╝
    """)


if __name__ == "__main__":
    logger.info("=" * 60)
    logger.info("Bắt đầu quy trình nạp dữ liệu pháp luật vào ChromaDB")
    logger.info("=" * 60)
    asyncio.run(index_legal_documents())
