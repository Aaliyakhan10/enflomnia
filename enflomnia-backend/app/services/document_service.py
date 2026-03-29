"""
Document Service — Enterprise ingestion engine for PDFs and unstructured data.
"""
import io
from sqlalchemy.orm import Session
from fastapi import HTTPException, UploadFile
from PyPDF2 import PdfReader
from app.services.knowledge_lake import KnowledgeLakeService

class DocumentService:
    def __init__(self, db: Session):
        self.db = db
        self.knowledge_svc = KnowledgeLakeService()

    async def extract_and_ingest_pdf(self, enterprise_id: str, file: UploadFile, title: str = "") -> dict:
        """
        Parses a PDF, extracts searchable text, and ingests it into Knowledge Lake.
        """
        if not file.filename or not file.filename.lower().endswith(".pdf"):
            raise HTTPException(status_code=400, detail="Only PDF files are accepted.")

        try:
            content = await file.read()
            reader = PdfReader(io.BytesIO(content))
            text_parts = []
            
            # Extract text from all pages
            for page in reader.pages:
                page_text = page.extract_text()
                if page_text:
                    text_parts.append(page_text)
                    
            extracted_text = "\n\n".join(text_parts)

            if not extracted_text.strip():
                raise HTTPException(status_code=422, detail="Text extraction failed. Ensure the PDF is not purely image-based.")

            # Ingest into Knowledge Lake
            doc_title = title if title else (file.filename or "Untitled Document")
            result = self.knowledge_svc.ingest_document(
                self.db, 
                enterprise_id, 
                doc_title, 
                extracted_text, 
                source_type="pdf"
            )
            
            return {"status": "success", "document": result, "pages_extracted": len(reader.pages)}
            
        except Exception as e:
            if isinstance(e, HTTPException):
                raise e
            raise HTTPException(status_code=500, detail=f"PDF Ingestion Engine Failed: {str(e)}")
