"""
Enterprise Model — Core enterprise profile for B2B data management.
"""
from sqlalchemy import Column, String, Text, DateTime
from datetime import datetime
from app.database import Base


class Enterprise(Base):
    __tablename__ = "enterprises"

    id = Column(String, primary_key=True)
    name = Column(String(255), nullable=False)
    industry = Column(String(100), default="general")
    brand_guidelines = Column(Text, default="")
    compliance_rules = Column(Text, default="")
    data_sovereignty_region = Column(String(50), default="us-central1")
    created_at = Column(DateTime, default=datetime.utcnow)
