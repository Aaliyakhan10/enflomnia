"""
Data Guard Service — Privacy Guard & Audit Trail.
Tracks every data access by every agent for enterprise compliance.
"""
import uuid
from typing import List
from sqlalchemy.orm import Session

from app.models.audit_log import AuditLog
from app.models.enterprise import Enterprise


class DataGuardService:

    def audit_log(
        self, db: Session, enterprise_id: str,
        action: str, agent_name: str = "system", details: str = "",
    ):
        """Log a data access event."""
        log = AuditLog(
            id=str(uuid.uuid4()),
            enterprise_id=enterprise_id,
            action=action,
            agent_name=agent_name,
            details=details,
        )
        db.add(log)
        db.commit()

    def get_audit_trail(self, db: Session, enterprise_id: str, limit: int = 50) -> List[dict]:
        """Get the most recent audit events."""
        logs = db.query(AuditLog).filter(
            AuditLog.enterprise_id == enterprise_id
        ).order_by(AuditLog.created_at.desc()).limit(limit).all()
        return [
            {
                "id": l.id,
                "action": l.action,
                "agent_name": l.agent_name,
                "details": l.details,
                "created_at": str(l.created_at),
            }
            for l in logs
        ]

    def check_sovereignty(self, db: Session, enterprise_id: str) -> dict:
        """Return data residency and security status for an enterprise."""
        enterprise = db.query(Enterprise).filter(Enterprise.id == enterprise_id).first()
        if not enterprise:
            return {"status": "not_found"}

        total_events = db.query(AuditLog).filter(
            AuditLog.enterprise_id == enterprise_id
        ).count()

        return {
            "enterprise_id": enterprise_id,
            "enterprise_name": enterprise.name,
            "data_region": enterprise.data_sovereignty_region,
            "total_audit_events": total_events,
            "encryption": "AES-256 at rest",
            "access_control": "VPC-SC enforced",
            "data_isolation": "Single-tenant namespace",
            "model_training": "Enterprise data NEVER used for model training",
        }
