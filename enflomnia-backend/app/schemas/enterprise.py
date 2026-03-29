"""
Enterprise Schemas — Pydantic models for request/response validation.
"""
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any

class EnterpriseCreate(BaseModel):
    name: str = Field(..., description="The official name of the enterprise.")
    industry: str = Field("general", description="Industry vertical (e.g., Tech, Finance).")
    brand_guidelines: str = ""
    compliance_rules: str = ""
    data_sovereignty_region: str = "us-central1"

class EnterpriseProfileUpdate(BaseModel):
    model_config = {"extra": "ignore"}
    
    name: Optional[str] = None
    industry: Optional[str] = None
    primary_product: Optional[str] = None
    target_audience: Optional[str] = None
    brand_voice: Optional[str] = None
    main_objectives: Optional[str] = None
    brand_guidelines: Optional[str] = None
    compliance_rules: Optional[str] = None

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
    count: int = Field(1, ge=1, le=4)

class CaptionGenerateRequest(BaseModel):
    description: str
    content_type: str = "video"  # video, image, post

class ComplianceCheck(BaseModel):
    content: str
    content_type: str = "Script / Video Idea"

class PublishPayload(BaseModel):
    type: str
    day: str
    video_url: Optional[str] = None
    caption: Optional[str] = None
    campaign_id: Optional[str] = None

class VideoCreateRequest(BaseModel):
    title: str
    input_props: dict
    script_id: Optional[str] = None
    video_url: Optional[str] = None
    status: Optional[str] = "completed"
