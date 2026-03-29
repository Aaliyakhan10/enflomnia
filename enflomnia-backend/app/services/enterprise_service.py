"""
Enterprise Service — Core business logic for enterprise lifecycle management.
Follows CODING_STANDARDS.md: Single Responsibility & Service-Driven.
"""
import uuid
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models.enterprise import Enterprise
from app.services.connector_service import ConnectorService
from app.services.knowledge_lake import KnowledgeLakeService
from app.services.fact_database import FactDatabaseService

class EnterpriseService:
    def __init__(self, db: Session):
        self.db = db
        self.connector_svc = ConnectorService()
        self.knowledge_svc = KnowledgeLakeService()
        self.fact_svc = FactDatabaseService()

    def get_or_create_enterprise(self, enterprise_id: str) -> Enterprise:
        """
        Retrieves an enterprise by ID. 
        Implements 'Auto-Onboarding' for the default Zero-UUID.
        """
        e = self.db.query(Enterprise).filter(Enterprise.id == enterprise_id).first()
        
        # Zero-Configuration Bootstrap (Production-Like UX)
        if not e and enterprise_id == "00000000-0000-0000-0000-000000000000":
            e = Enterprise(
                id=enterprise_id,
                name="Default Workspace",
                industry="Technology",
                primary_product="Enflomnia AI Catalyst"
            )
            self.db.add(e)
            self.db.commit()
            self.db.refresh(e)
            
        if not e:
            raise HTTPException(status_code=404, detail="Enterprise not found")
        return e

    def update_profile(self, enterprise_id: str, data: Dict[str, Any]) -> Enterprise:
        """Updates enterprise profile fields with validation. Ignores null values."""
        e = self.get_or_create_enterprise(enterprise_id)
        for key, value in data.items():
            if hasattr(e, key) and value is not None:
                setattr(e, key, value)
        
        self.db.commit()
        self.db.refresh(e)
        return e

    def get_detailed_stats(self, enterprise_id: str) -> Dict[str, Any]:
        """Aggregates metrics from connectors, knowledge, and facts."""
        e = self.get_or_create_enterprise(enterprise_id)
        connectors = self.connector_svc.list_connectors(self.db, enterprise_id)
        docs = self.knowledge_svc.list_documents(self.db, enterprise_id)
        facts = self.fact_svc.get_facts(self.db, enterprise_id)
        
        return {
            "id": e.id,
            "name": e.name,
            "industry": e.industry,
            "data_sovereignty_region": e.data_sovereignty_region,
            "stats": {
                "connectors": len(connectors),
                "connectors_active": sum(1 for c in connectors if c["status"] == "active"),
                "knowledge_docs": len(docs),
                "facts_tracked": len(facts),
            },
            "created_at": str(e.created_at),
        }

    def register_enterprise(self, name: str, industry: str, region: str = "us-central1") -> Enterprise:
        """Enrolls a new enterprise into the Enflomnia ecosystem."""
        enterprise = Enterprise(
            id=str(uuid.uuid4()),
            name=name,
            industry=industry,
            data_sovereignty_region=region,
        )
        self.db.add(enterprise)
        self.db.commit()
        self.db.refresh(enterprise)
        return enterprise
