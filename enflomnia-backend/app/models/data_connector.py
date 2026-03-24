"""
DataConnector Model — Managed connector configs (Google Drive, Salesforce, Slack).
"""
from sqlalchemy import Column, String, Text, DateTime, Integer
from datetime import datetime
from app.database import Base


class DataConnector(Base):
    __tablename__ = "data_connectors"

    id = Column(String, primary_key=True)
    enterprise_id = Column(String, nullable=False, index=True)
    connector_type = Column(String(50), nullable=False)  # gdrive, salesforce, slack
    display_name = Column(String(255), default="")
    status = Column(String(20), default="pending")  # pending, active, syncing, error
    config_json = Column(Text, default="{}")
    sync_frequency = Column(String(20), default="hourly")  # realtime, hourly, daily
    documents_synced = Column(Integer, default=0)
    last_sync_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
