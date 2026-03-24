"""
Enterprise Router — All enterprise data management endpoints.
Handles connectors, knowledge lake, fact database, and privacy guard.
"""
import uuid
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional

from app.database import get_db
from app.models.enterprise import Enterprise
from app.services.connector_service import ConnectorService
from app.services.knowledge_lake import KnowledgeLakeService
from app.services.fact_database import FactDatabaseService
from app.services.data_guard import DataGuardService

router = APIRouter(prefix="/api/enterprise", tags=["Enterprise Vault"])

connector_svc = ConnectorService()
knowledge_svc = KnowledgeLakeService()
fact_svc = FactDatabaseService()
guard_svc = DataGuardService()


# ── Schemas ──────────────────────────────────────────────────────────────────

class EnterpriseCreate(BaseModel):
    name: str
    industry: str = "general"
    brand_guidelines: str = ""
    compliance_rules: str = ""
    data_sovereignty_region: str = "us-central1"

class ConnectorCreate(BaseModel):
    connector_type: str  # gdrive, salesforce, slack
    display_name: str = ""
    sync_frequency: str = "hourly"

class KnowledgeIngest(BaseModel):
    title: str
    content: str
    source_type: str = "text"

class FactUpsert(BaseModel):
    category: str
    key: str
    value: str
    source: str = "manual"

class ContentCheck(BaseModel):
    content: str

class FactsCSVImport(BaseModel):
    csv_text: str


# ── Enterprise CRUD ──────────────────────────────────────────────────────────

@router.post("/register")
def register_enterprise(body: EnterpriseCreate, db: Session = Depends(get_db)):
    enterprise = Enterprise(
        id=str(uuid.uuid4()),
        name=body.name,
        industry=body.industry,
        brand_guidelines=body.brand_guidelines,
        compliance_rules=body.compliance_rules,
        data_sovereignty_region=body.data_sovereignty_region,
    )
    db.add(enterprise)
    db.commit()
    db.refresh(enterprise)
    return {
        "id": enterprise.id, "name": enterprise.name,
        "industry": enterprise.industry,
        "data_sovereignty_region": enterprise.data_sovereignty_region,
        "created_at": str(enterprise.created_at),
    }

@router.get("/{enterprise_id}")
def get_enterprise(enterprise_id: str, db: Session = Depends(get_db)):
    e = db.query(Enterprise).filter(Enterprise.id == enterprise_id).first()
    if not e:
        return {"error": "Enterprise not found"}
    connectors = connector_svc.list_connectors(db, enterprise_id)
    docs = knowledge_svc.list_documents(db, enterprise_id)
    facts = fact_svc.get_facts(db, enterprise_id)
    return {
        "id": e.id, "name": e.name, "industry": e.industry,
        "data_sovereignty_region": e.data_sovereignty_region,
        "stats": {
            "connectors": len(connectors),
            "connectors_active": sum(1 for c in connectors if c["status"] == "active"),
            "knowledge_docs": len(docs),
            "facts_tracked": len(facts),
        },
        "created_at": str(e.created_at),
    }


# ── Managed Connectors ──────────────────────────────────────────────────────

@router.post("/{enterprise_id}/connectors")
def register_connector(enterprise_id: str, body: ConnectorCreate, db: Session = Depends(get_db)):
    return connector_svc.register_connector(
        db, enterprise_id, body.connector_type, body.display_name, sync_frequency=body.sync_frequency,
    )

@router.get("/{enterprise_id}/connectors")
def list_connectors(enterprise_id: str, db: Session = Depends(get_db)):
    return connector_svc.list_connectors(db, enterprise_id)

@router.post("/{enterprise_id}/connectors/{connector_id}/sync")
def sync_connector(enterprise_id: str, connector_id: str, db: Session = Depends(get_db)):
    return connector_svc.sync_connector(db, connector_id)


# ── Knowledge Lake ───────────────────────────────────────────────────────────

@router.post("/{enterprise_id}/knowledge/ingest")
def ingest_knowledge(enterprise_id: str, body: KnowledgeIngest, db: Session = Depends(get_db)):
    return knowledge_svc.ingest_document(
        db, enterprise_id, body.title, body.content, body.source_type,
    )

@router.get("/{enterprise_id}/knowledge/documents")
def list_knowledge(enterprise_id: str, db: Session = Depends(get_db)):
    return knowledge_svc.list_documents(db, enterprise_id)

@router.get("/{enterprise_id}/knowledge/search")
def search_knowledge(
    enterprise_id: str,
    q: str = Query(..., description="Search query"),
    db: Session = Depends(get_db),
):
    return knowledge_svc.search_knowledge(db, enterprise_id, q)


# ── Fact Database ────────────────────────────────────────────────────────────

@router.post("/{enterprise_id}/facts")
def upsert_fact(enterprise_id: str, body: FactUpsert, db: Session = Depends(get_db)):
    return fact_svc.upsert_fact(
        db, enterprise_id, body.category, body.key, body.value, body.source,
    )

@router.get("/{enterprise_id}/facts")
def get_facts(
    enterprise_id: str,
    category: Optional[str] = None,
    db: Session = Depends(get_db),
):
    return fact_svc.get_facts(db, enterprise_id, category)

@router.post("/{enterprise_id}/facts/check")
def check_content(enterprise_id: str, body: ContentCheck, db: Session = Depends(get_db)):
    return fact_svc.check_content_facts(db, enterprise_id, body.content)

@router.post("/{enterprise_id}/facts/import-csv")
def import_csv(enterprise_id: str, body: FactsCSVImport, db: Session = Depends(get_db)):
    return fact_svc.import_facts_csv(db, enterprise_id, body.csv_text)


# ── Privacy Guard ────────────────────────────────────────────────────────────

@router.get("/{enterprise_id}/audit")
def get_audit_trail(enterprise_id: str, db: Session = Depends(get_db)):
    return guard_svc.get_audit_trail(db, enterprise_id)

@router.get("/{enterprise_id}/sovereignty")
def check_sovereignty(enterprise_id: str, db: Session = Depends(get_db)):
    return guard_svc.check_sovereignty(db, enterprise_id)
