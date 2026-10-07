from fastapi import APIRouter, UploadFile, File, Form, HTTPException, status
from loguru import logger
from app.schemas.pdf import QuestionRequest, PDFResponse
from app.services.pdf_service import get_pdf_service

router = APIRouter(
    tags=["PDF Document AI"]
)

@router.post("/upload", response_model=PDFResponse, summary="Tải lên PDF và tạo chỉ mục Vector")
async def upload_pdf_for_qa(file: UploadFile = File(...)):
    """Frontend gọi endpoint này khi người dùng tải PDF lên để chat"""
    try:
        if not file.filename.lower().endswith('.pdf'):
            raise HTTPException(status_code=400, detail="Chỉ chấp nhận file định dạng .pdf")
        content = await file.read()
        if len(content) == 0:
            raise HTTPException(status_code=400, detail="File PDF rỗng, vui lòng kiểm tra lại.")
        pdf_service = get_pdf_service()
        pdf_id = pdf_service.generate_pdf_id(content)
        # Lưu file vật lý
        pdf_service.save_pdf_file(content, pdf_id, file.filename)
        # Tạo vector store cô lập
        qa_setup_result = await pdf_service.setup_pdf_qa(content, pdf_id)
        return PDFResponse(
            success=True,
            message="Tải lên và lập chỉ mục PDF thành công.",
            data={
                "filename": file.filename,
                "file_id": pdf_id,
                **qa_setup_result
            }
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Lỗi upload PDF: {e}")
        raise HTTPException(status_code=500, detail=str(e))
@router.post("/summarize-id", response_model=PDFResponse, summary="Tóm tắt tài liệu PDF bằng ID")
async def summarize_pdf_by_id(
    file_id: str = Form(...),
    max_length: int = Form(200)
):
    """Frontend gọi endpoint này để nhận bản tóm tắt nội dung sau khi upload"""
    try:
        pdf_service = get_pdf_service()
        content = pdf_service.get_pdf_content(file_id)
        if not content:
            raise HTTPException(status_code=404, detail=f"Không tìm thấy tài liệu với ID: {file_id}")
        result = await pdf_service.summarize_pdf(content)
        return PDFResponse(
            success=True,
            message="Tóm tắt tài liệu thành công.",
            data={
                "pdf_id": file_id,
                **result
            }
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Lỗi tóm tắt PDF: {e}")
        raise HTTPException(status_code=500, detail=str(e))
@router.post("/ask", response_model=PDFResponse, summary="Đặt câu hỏi về nội dung file PDF")
async def ask_pdf_question(request: QuestionRequest):
    """Frontend gọi endpoint này để người dùng chat trực tiếp với file PDF"""
    try:
        pdf_service = get_pdf_service()
        result = await pdf_service.ask_pdf(
            pdf_id=request.pdf_id,
            question=request.question,
            top_k=request.top_k
        )
        return PDFResponse(
            success=True,
            message="Trả lời câu hỏi thành công.",
            data={
                "question": request.question,
                **result
            }
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Lỗi hỏi đáp PDF: {e}")
        raise HTTPException(status_code=500, detail=str(e))
@router.delete("/session/{pdf_id}", response_model=PDFResponse, summary="Giải phóng bộ nhớ file PDF")
async def clear_session(pdf_id: str):
    try:
        pdf_service = get_pdf_service()
        pdf_service.clear_pdf_session(pdf_id)
        return PDFResponse(success=True, message=f"Đã giải phóng session: {pdf_id}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
