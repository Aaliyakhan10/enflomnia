"""
Enterprise Router — All enterprise data management endpoints.
Handles connectors, knowledge lake, fact database, and privacy guard.
"""
import uuid
import io
from fastapi import APIRouter, Depends, Query, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional

from app.database import get_db
from app.models.enterprise import Enterprise
from app.services.connector_service import ConnectorService
from app.services.knowledge_lake import KnowledgeLakeService
from app.services.fact_database import FactDatabaseService
from app.services.data_guard import DataGuardService
from app.services.campaign_service import CampaignService
from app.services.video_service import VideoService
from app.schemas.campaign import CampaignCreate

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

class ImageGenerateRequest(BaseModel):
    prompt: str
    aspect_ratio: str = "1:1"
    count: int = 1  # 1-4 images

class CaptionGenerateRequest(BaseModel):
    description: str
    content_type: str = "video"  # video, image, post

class ComplianceCheck(BaseModel):
    content: str
    content_type: str = "Script / Video Idea"

class PublishPayload(BaseModel):
    type: str
    day: str

class VideoCreateRequest(BaseModel):
    title: str
    input_props: dict
    script_id: Optional[str] = None


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

# ── Bark: Compliance Gate ────────────────────────────────────────────────────

@router.post("/{enterprise_id}/compliance/audit")
def audit_content(enterprise_id: str, body: ComplianceCheck, db: Session = Depends(get_db)):
    from app.services.compliance_service import ComplianceService
    compliance_svc = ComplianceService(db)
    return compliance_svc.audit_content(enterprise_id, body.content, body.content_type)

# ── Fruit: Publishing Gate ──────────────────────────────────────────────────

@router.post("/{enterprise_id}/publish")
def publish_content(enterprise_id: str, body: PublishPayload, db: Session = Depends(get_db)):
    from app.services.publishing_service import PublishingService
    pub_svc = PublishingService(db)
    return pub_svc.publish_content(enterprise_id, body.model_dump())

# ── Campaign Strategist ──────────────────────────────────────────────────────

@router.post("/{enterprise_id}/campaigns")
def generate_campaign(enterprise_id: str, body: CampaignCreate, db: Session = Depends(get_db)):
    campaign_svc = CampaignService(db)
    return campaign_svc.generate_campaign(enterprise_id, body.goal)

@router.get("/{enterprise_id}/campaigns")
def list_campaigns(enterprise_id: str, db: Session = Depends(get_db)):
    campaign_svc = CampaignService(db)
    return campaign_svc.list_campaigns(enterprise_id)


# ── Creative Studio ──────────────────────────────────────────────────────────

@router.post("/{enterprise_id}/image/generate")
def generate_creative_image(enterprise_id: str, body: ImageGenerateRequest, db: Session = Depends(get_db)):
    from app.integrations.gemini_client import GeminiClient
    try:
        context = knowledge_svc.get_context_for_agent(db, enterprise_id, "image generation")
        full_prompt = f"Context: {context}\n\nTask: Generate an image for {body.prompt}" if context else body.prompt
        
        client = GeminiClient()
        images = client.generate_image(
            prompt=full_prompt,
            aspect_ratio=body.aspect_ratio,
            number_of_images=body.count,
        )
        return {"images": images, "prompt": body.prompt, "count": len(images)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{enterprise_id}/caption/generate")
def generate_caption(enterprise_id: str, body: CaptionGenerateRequest, db: Session = Depends(get_db)):
    from app.integrations.gemini_client import GeminiClient
    try:
        context = knowledge_svc.get_context_for_agent(db, enterprise_id, "caption generation")
        
        client = GeminiClient()
        caption = client.generate_caption(
            description=body.description,
            content_type=body.content_type,
            context=context
        )
        # Note: GeminiClient.generate_caption might need to be updated to accept context
        # For now, we'll assume it handles context if we inject it into the description or similar
        return {"caption": caption, "content_type": body.content_type}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── Knowledge Lake: PDF Upload ───────────────────────────────────────────────

@router.post("/{enterprise_id}/knowledge/upload-pdf")
async def upload_pdf(
    enterprise_id: str,
    file: UploadFile = File(...),
    title: str = Form(""),
    db: Session = Depends(get_db),
):
    """Upload a PDF, extract text, and ingest into Knowledge Lake."""
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are accepted.")

    try:
        from PyPDF2 import PdfReader
        content = await file.read()
        reader = PdfReader(io.BytesIO(content))
        text_parts = []
        for page in reader.pages:
            page_text = page.extract_text()
            if page_text:
                text_parts.append(page_text)
        extracted_text = "\n\n".join(text_parts)

        if not extracted_text.strip():
            raise HTTPException(status_code=422, detail="Could not extract text from the PDF. It may be image-based.")

        doc_title = title if title else (file.filename or "Untitled PDF")
        result = knowledge_svc.ingest_document(
            db, enterprise_id, doc_title, extracted_text, source_type="pdf",
        )
        return {"status": "success", "document": result, "pages_extracted": len(reader.pages)}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PDF processing failed: {str(e)}")


# ── Video Studio ─────────────────────────────────────────────────────────────

@router.post("/{enterprise_id}/videos")
def generate_video(enterprise_id: str, body: VideoCreateRequest, db: Session = Depends(get_db)):
    video_svc = VideoService(db)
    return video_svc.create_video_request(
        enterprise_id, body.title, body.input_props, script_id=body.script_id
    )

@router.get("/{enterprise_id}/videos")
def list_videos(enterprise_id: str, db: Session = Depends(get_db)):
    video_svc = VideoService(db)
    return video_svc.list_videos(enterprise_id)

@router.get("/{enterprise_id}/videos/{video_id}")
def get_video(enterprise_id: str, video_id: str, db: Session = Depends(get_db)):
    video_svc = VideoService(db)
    video = video_svc.get_video(video_id)
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")
    return video
