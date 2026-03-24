"""
AuditLog Model — Privacy guard audit trail for enterprise data access.
"""
from sqlalchemy import Column, String, Text, DateTime
from datetime import datetime
from app.database import Base


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String, primary_key=True)
    enterprise_id = Column(String, nullable=False, index=True)
    action = Column(String(100), nullable=False)  # knowledge_read, fact_check, connector_sync
    agent_name = Column(String(50), default="system")
    details = Column(Text, default="")
    created_at = Column(DateTime, default=datetime.utcnow)
