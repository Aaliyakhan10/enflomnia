"""
KnowledgeDocument Model — Ingested knowledge from PDFs, docs, URLs.
"""
from sqlalchemy import Column, String, Text, DateTime, Integer
from datetime import datetime
from app.database import Base


class KnowledgeDocument(Base):
    __tablename__ = "knowledge_documents"

    id = Column(String, primary_key=True)
    enterprise_id = Column(String, nullable=False, index=True)
    source_type = Column(String(20), nullable=False)  # pdf, doc, ppt, url, text
    title = Column(String(500), nullable=False)
    content_text = Column(Text, default="")
    embedding_summary = Column(Text, default="")  # Gemini-generated 3-sentence distillation
    file_url = Column(String(1000), default="")
    word_count = Column(Integer, default=0)
    status = Column(String(20), default="processing")  # processing, indexed, failed
    ingested_at = Column(DateTime, default=datetime.utcnow)
