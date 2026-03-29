"""
Enterprise Router — High-level API orchestration for the Enterprise Vault.
Follows CODING_STANDARDS.md: Lean Router, Logic in Services, Standardized Errors.
"""
from fastapi import APIRouter, Depends, Query, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import Optional

from app.database import get_db
from app.dependencies import get_current_user
from app.schemas.enterprise import (
    EnterpriseCreate, EnterpriseProfileUpdate, ConnectorCreate, KnowledgeIngest, 
    FactUpsert, ContentCheck, FactsCSVImport, ImageGenerateRequest, 
    CaptionGenerateRequest, ComplianceCheck, PublishPayload, VideoCreateRequest
)
from app.schemas.campaign import CampaignCreate
from app.services.enterprise_service import EnterpriseService
from app.services.creative_studio_service import CreativeStudioService
from app.services.document_service import DocumentService
from app.services.campaign_service import CampaignService
from app.services.video_service import VideoService
from app.services.connector_service import ConnectorService
from app.services.knowledge_lake import KnowledgeLakeService
from app.services.fact_database import FactDatabaseService
from app.services.data_guard import DataGuardService

router = APIRouter(prefix="/api/enterprise", tags=["Enterprise Vault"])

# ── Dependency Injection ─────────────────────────────────────────────────────

def get_ent_svc(db: Session = Depends(get_db)) -> EnterpriseService:
    return EnterpriseService(db)

def get_creative_svc(db: Session = Depends(get_db)) -> CreativeStudioService:
    return CreativeStudioService(db)

def get_doc_svc(db: Session = Depends(get_db)) -> DocumentService:
    return DocumentService(db)

# ── Enterprise CRUD ──────────────────────────────────────────────────────────

@router.post("/register")
def register_enterprise(body: EnterpriseCreate, ent_svc: EnterpriseService = Depends(get_ent_svc)):
    """Enrolls a new brand into the Enflomnia ecosystem."""
    return ent_svc.register_enterprise(body.name, body.industry, body.data_sovereignty_region)

@router.get("/{enterprise_id}")
def get_enterprise(enterprise_id: str, ent_svc: EnterpriseService = Depends(get_ent_svc)):
    """Fetches the core enterprise profile and stats."""
    return ent_svc.get_detailed_stats(enterprise_id)

@router.patch("/{enterprise_id}/profile")
def update_enterprise_profile(
    enterprise_id: str, 
    body: EnterpriseProfileUpdate, 
    ent_svc: EnterpriseService = Depends(get_ent_svc)
):
    """Updates the brand's 'DNA' (Voice, Product, Objectives)."""
    return ent_svc.update_profile(enterprise_id, body.model_dump(exclude_unset=True))

# ── Managed Connectors ────────────────────────────────────────────────────────

@router.post("/{enterprise_id}/connectors")
def register_connector(
    enterprise_id: str, 
    body: ConnectorCreate, 
    db: Session = Depends(get_db)
):
    return ConnectorService().register_connector(
        db, enterprise_id, body.connector_type, body.display_name, sync_frequency=body.sync_frequency
    )

@router.get("/{enterprise_id}/connectors")
def list_connectors(enterprise_id: str, db: Session = Depends(get_db)):
    return ConnectorService().list_connectors(db, enterprise_id)

# ── Knowledge Lake ───────────────────────────────────────────────────────────

@router.post("/{enterprise_id}/knowledge/ingest")
def ingest_knowledge(enterprise_id: str, body: KnowledgeIngest, db: Session = Depends(get_db)):
    return KnowledgeLakeService().ingest_document(
        db, enterprise_id, body.title, body.content, body.source_type
    )

@router.get("/{enterprise_id}/knowledge/documents")
def list_knowledge(enterprise_id: str, db: Session = Depends(get_db)):
    return KnowledgeLakeService().list_documents(db, enterprise_id)

@router.get("/{enterprise_id}/knowledge/search")
def search_knowledge(
    enterprise_id: str,
    q: str = Query(..., description="Search query"),
    db: Session = Depends(get_db),
):
    return KnowledgeLakeService().search_knowledge(db, enterprise_id, q)

@router.post("/{enterprise_id}/knowledge/upload-pdf")
async def upload_pdf(
    enterprise_id: str,
    file: UploadFile = File(...),
    title: str = Form(""),
    doc_svc: DocumentService = Depends(get_doc_svc)
):
    """Processes PDF documents into searchable Knowledge Lake context."""
    return await doc_svc.extract_and_ingest_pdf(enterprise_id, file, title)

# ── Fact Database ────────────────────────────────────────────────────────────

@router.post("/{enterprise_id}/facts")
def upsert_fact(enterprise_id: str, body: FactUpsert, db: Session = Depends(get_db)):
    return FactDatabaseService().upsert_fact(
        db, enterprise_id, body.category, body.key, body.value, body.source
    )

@router.get("/{enterprise_id}/facts")
def get_facts(
    enterprise_id: str,
    category: Optional[str] = None,
    db: Session = Depends(get_db),
):
    return FactDatabaseService().get_facts(db, enterprise_id, category)

# ── Compliance & Safety (Aegis Gate) ──────────────────────────────────────────

@router.post("/{enterprise_id}/compliance/audit")
def audit_content(
    enterprise_id: str, 
    body: ComplianceCheck, 
    db: Session = Depends(get_db)
):
    from app.services.compliance_service import ComplianceService
    return ComplianceService(db).audit_content(enterprise_id, body.content, body.content_type)

# ── Campaign Strategist (DNA & Soil) ──────────────────────────────────────────

@router.post("/{enterprise_id}/campaigns")
def generate_campaign(
    enterprise_id: str, 
    body: CampaignCreate, 
    db: Session = Depends(get_db), 
    current_user: dict = Depends(get_current_user)
):
    svc = CampaignService(db)
    return svc.generate_campaign(enterprise_id, body.goal, user_email=current_user.get("email"))

@router.get("/{enterprise_id}/campaigns")
def list_campaigns(
    enterprise_id: str, 
    db: Session = Depends(get_db), 
    current_user: dict = Depends(get_current_user)
):
    return CampaignService(db).list_campaigns(enterprise_id, user_email=current_user.get("email"))

@router.get("/{enterprise_id}/suggest-objectives")
def suggest_campaign_objectives(enterprise_id: str, db: Session = Depends(get_db)):
    return CampaignService(db).suggest_objectives(enterprise_id)

@router.get("/{enterprise_id}/magic-scan-persona")
def magic_scan_persona(enterprise_id: str, db: Session = Depends(get_db)):
    """Scans Knowledge Lake to derive the Enterprise Persona automatically."""
    return CampaignService(db).magic_scan_persona(enterprise_id)

# ── Creative Studio ───────────────────────────────────────────────────────────

@router.post("/{enterprise_id}/image/generate")
def generate_creative_image(
    enterprise_id: str, 
    body: ImageGenerateRequest, 
    creative_svc: CreativeStudioService = Depends(get_creative_svc),
    current_user: dict = Depends(get_current_user)
):
    return creative_svc.generate_image(
        enterprise_id, body.prompt, current_user.get("email"), 
        aspect_ratio=body.aspect_ratio, count=body.count
    )

@router.post("/{enterprise_id}/caption/generate")
def generate_caption(
    enterprise_id: str, 
    body: CaptionGenerateRequest, 
    creative_svc: CreativeStudioService = Depends(get_creative_svc)
):
    return creative_svc.generate_caption(enterprise_id, body.description, body.content_type)

# ── Video Studio ─────────────────────────────────────────────────────────────

@router.post("/{enterprise_id}/videos")
def generate_video(
    enterprise_id: str, 
    body: VideoCreateRequest, 
    db: Session = Depends(get_db), 
    current_user: dict = Depends(get_current_user)
):
    svc = VideoService(db)
    return svc.create_video_request(
        enterprise_id, body.title, body.input_props, 
        script_id=body.script_id, user_email=current_user.get("email")
    )

@router.get("/{enterprise_id}/videos")
def list_videos(enterprise_id: str, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    return VideoService(db).list_videos(enterprise_id, user_email=current_user.get("email"))

# ── Fruit: Publishing Gate ──────────────────────────────────────────────────

@router.post("/{enterprise_id}/publish")
def publish_content(enterprise_id: str, body: PublishPayload, db: Session = Depends(get_db)):
    from app.services.publishing_service import PublishingService
    return PublishingService(db).publish_content(enterprise_id, body.model_dump())
