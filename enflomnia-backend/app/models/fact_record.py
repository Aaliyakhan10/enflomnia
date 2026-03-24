"""
FactRecord Model — Structured facts (prices, dates, inventory) for content grounding.
"""
from sqlalchemy import Column, String, Text, DateTime, Boolean
from datetime import datetime
from app.database import Base


class FactRecord(Base):
    __tablename__ = "fact_records"

    id = Column(String, primary_key=True)
    enterprise_id = Column(String, nullable=False, index=True)
    category = Column(String(50), nullable=False)  # pricing, inventory, dates, contacts, policy
    key = Column(String(255), nullable=False)
    value = Column(Text, nullable=False)
    source = Column(String(255), default="manual")
    is_stale = Column(Boolean, default=False)
    last_verified_at = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)
