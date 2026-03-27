"""
Connector Service — Managed Connectors for Enterprise Data Sources.
Handles registration, sync simulation, and status tracking for
Google Drive, Salesforce, and Slack integrations.
"""
import uuid
import json
from datetime import datetime
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session

from app.models.data_connector import DataConnector
from app.models.knowledge_document import KnowledgeDocument
from app.models.audit_log import AuditLog
from app.integrations.gemini_client import GeminiClient

AGENT_NAME = "connector"

# Simulated data per connector type (for hackathon demo)
DEMO_DATA: Dict[str, List[Dict[str, str]]] = {
    "gdrive": [
        {"title": "Q4 Product Strategy", "content": "Our Q4 strategy focuses on expanding into the APAC market with localized content. Key product updates include the new Enterprise Dashboard, AI-powered analytics suite, and real-time collaboration features. Target launch: November 15. Budget allocation: 40% digital, 30% events, 30% partnerships."},
        {"title": "Brand Voice Guidelines 2024", "content": "Tone: Professional yet approachable. Always use active voice. Avoid jargon unless addressing technical audiences. Brand colors: #7c3aed (primary), #f59e0b (accent). Never use superlatives without data backing. Compliance: all claims must be verifiable."},
        {"title": "Customer Success Report", "content": "NPS Score: 72 (+8 from Q3). Top feature requests: better mobile experience, API integrations, bulk export. Churn rate: 3.2% (down from 4.1%). Key testimonial: 'Enflomnia cut our content cycle from 10 days to 2 hours.' - VP Marketing, TechCorp"},
    ],
    "salesforce": [
        {"title": "Enterprise Pipeline Q4", "content": "Active opportunities: 47 ($2.3M pipeline). Top verticals: FinTech (12 deals), HealthTech (8 deals), E-commerce (15 deals). Average deal size: $48,900. Win rate: 34%. Key competitor: ContentHub (losing on AI capabilities). Next closes: MegaCorp ($120K, Dec 1), DataFlow ($85K, Nov 15)."},
        {"title": "Product Pricing Matrix", "content": "Starter: $499/mo (up to 10 users, 100 posts/mo). Growth: $999/mo (up to 50 users, 500 posts/mo, brand governance). Enterprise: $2,499/mo (unlimited users, unlimited posts, VPC-SC, dedicated support). Custom: contact sales. All plans include Gemini Cortex and Remotion Engine."},
    ],
    "slack": [
        {"title": "Marketing Team Discussion - Campaign Ideas", "content": "Thread from #marketing-strategy: 'We should do a behind-the-scenes series showing how AI creates content.' Reply: 'Love it — maybe tie it to the product launch in November?' Reply: 'Could we get 3 creators to do a collab? Budget is $15K for influencer partnerships this quarter.'"},
        {"title": "Product Launch Checklist", "content": "Launch date: November 15. Status: Blog post (done), Landing page (in review), Email sequence (drafting), Social media kit (not started), Press release (not started), Demo video (scripting). Owner: Marketing team. Stakeholder review: November 8."},
    ],
}


class ConnectorService:

    def __init__(self):
        self.gemini = GeminiClient()

    def register_connector(
        self, db: Session, enterprise_id: str,
        connector_type: str, display_name: str = "",
        config: Optional[Dict[str, Any]] = None, sync_frequency: str = "hourly",
    ) -> Dict[str, Any]:
        """Register a new managed connector."""
        connector = DataConnector(
            id=str(uuid.uuid4()),
            enterprise_id=enterprise_id,
            connector_type=connector_type,
            display_name=display_name or f"{connector_type.title()} Connector",
            status="active",
            config_json=json.dumps(config or {}),
            sync_frequency=sync_frequency,
            documents_synced=0,
        )
        db.add(connector)

        # Log the registration
        db.add(AuditLog(
            id=str(uuid.uuid4()),
            enterprise_id=enterprise_id,
            action="connector_registered",
            agent_name=AGENT_NAME,
            details=f"Registered {connector_type} connector: {display_name}",
        ))

        db.commit()
        db.refresh(connector)
        return self._to_dict(connector)

    def sync_connector(self, db: Session, connector_id: str) -> Dict[str, Any]:
        """
        Simulate a sync: pull demo data from the connector source
        and ingest it into the Knowledge Lake.
        """
        connector = db.query(DataConnector).filter(DataConnector.id == connector_id).first()
        if not connector:
            return {"error": "Connector not found"}

        connector.status = "syncing"
        db.commit()

        # Get demo documents for this connector type
        demo_docs = DEMO_DATA.get(connector.connector_type, [])
        synced = 0

        for doc_data in demo_docs:
            # Check if already ingested
            existing = db.query(KnowledgeDocument).filter(
                KnowledgeDocument.enterprise_id == connector.enterprise_id,
                KnowledgeDocument.title == doc_data["title"],
            ).first()
            if existing:
                continue

            # Generate a Gemini summary
            try:
                summary = self.gemini.invoke_model(
                    f"Summarize this enterprise document in exactly 3 sentences. Focus on actionable data points:\n\n{doc_data['content']}",
                    max_tokens=200, agent_name=AGENT_NAME,
                )
            except Exception:
                summary = doc_data["content"][:200] + "..."

            doc = KnowledgeDocument(
                id=str(uuid.uuid4()),
                enterprise_id=connector.enterprise_id,
                source_type=connector.connector_type,
                title=doc_data["title"],
                content_text=doc_data["content"],
                embedding_summary=summary,
                word_count=len(doc_data["content"].split()),
                status="indexed",
            )
            db.add(doc)
            synced += 1

        connector.status = "active"
        connector.documents_synced = (connector.documents_synced or 0) + synced
        connector.last_sync_at = datetime.utcnow()

        db.add(AuditLog(
            id=str(uuid.uuid4()),
            enterprise_id=connector.enterprise_id,
            action="connector_sync",
            agent_name=AGENT_NAME,
            details=f"Synced {synced} docs from {connector.connector_type}",
        ))

        db.commit()
        db.refresh(connector)
        return {**self._to_dict(connector), "documents_synced_this_run": synced}

    def list_connectors(self, db: Session, enterprise_id: str) -> List[Dict[str, Any]]:
        connectors = db.query(DataConnector).filter(
            DataConnector.enterprise_id == enterprise_id
        ).order_by(DataConnector.created_at.desc()).all()
        return [self._to_dict(c) for c in connectors]

    def _to_dict(self, c: DataConnector) -> Dict[str, Any]:
        return {
            "id": c.id,
            "enterprise_id": c.enterprise_id,
            "connector_type": c.connector_type,
            "display_name": c.display_name,
            "status": c.status,
            "sync_frequency": c.sync_frequency,
            "documents_synced": c.documents_synced or 0,
            "last_sync_at": str(c.last_sync_at) if c.last_sync_at else None,
            "created_at": str(c.created_at),
        }
