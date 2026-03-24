"""
Fact Database Service — "The Fact Sheet"
Manages structured facts (prices, inventory, dates) and validates
content against the fact base to prevent stale/wrong references.
"""
import uuid
import csv
import io
from datetime import datetime
from typing import List
from sqlalchemy.orm import Session

from app.models.fact_record import FactRecord
from app.models.audit_log import AuditLog
from app.integrations.gemini_client import GeminiClient

AGENT_NAME = "fact_database"


class FactDatabaseService:

    def __init__(self):
        self.gemini = GeminiClient()

    def upsert_fact(
        self, db: Session, enterprise_id: str,
        category: str, key: str, value: str, source: str = "manual",
    ) -> dict:
        """Insert or update a fact. If key already exists, update value."""
        existing = db.query(FactRecord).filter(
            FactRecord.enterprise_id == enterprise_id,
            FactRecord.category == category,
            FactRecord.key == key,
        ).first()

        if existing:
            existing.value = value
            existing.source = source
            existing.is_stale = False
            existing.last_verified_at = datetime.utcnow()
            db.commit()
            db.refresh(existing)
            return self._to_dict(existing)

        fact = FactRecord(
            id=str(uuid.uuid4()),
            enterprise_id=enterprise_id,
            category=category,
            key=key,
            value=value,
            source=source,
        )
        db.add(fact)

        db.add(AuditLog(
            id=str(uuid.uuid4()),
            enterprise_id=enterprise_id,
            action="fact_upsert",
            agent_name=AGENT_NAME,
            details=f"Upserted fact: {category}/{key}",
        ))

        db.commit()
        db.refresh(fact)
        return self._to_dict(fact)

    def get_facts(self, db: Session, enterprise_id: str, category: str = None) -> List[dict]:
        query = db.query(FactRecord).filter(FactRecord.enterprise_id == enterprise_id)
        if category:
            query = query.filter(FactRecord.category == category)
        facts = query.order_by(FactRecord.category, FactRecord.key).all()
        return [self._to_dict(f) for f in facts]

    def check_content_facts(self, db: Session, enterprise_id: str, content_text: str) -> dict:
        """
        Validate content against the fact database.
        Gemini checks if any facts are referenced incorrectly.
        """
        facts = self.get_facts(db, enterprise_id)
        if not facts:
            return {"status": "no_facts", "issues": [], "content_ok": True}

        facts_summary = "\n".join([
            f"- {f['category']}/{f['key']}: {f['value']}"
            for f in facts
        ])

        try:
            result = self.gemini.invoke_model_json(
                f"""You are a brand compliance checker. Compare this content against the company's fact database.

FACT DATABASE:
{facts_summary}

CONTENT TO CHECK:
{content_text}

Return ONLY valid JSON:
{{
  "content_ok": true/false,
  "issues": [
    {{
      "fact_key": "the fact that was wrong",
      "content_says": "what the content claims",
      "fact_says": "what the database says",
      "severity": "error" | "warning"
    }}
  ],
  "summary": "1-sentence summary of the check"
}}

If the content doesn't reference any facts, return content_ok: true with empty issues.""",
                agent_name=AGENT_NAME,
            )

            db.add(AuditLog(
                id=str(uuid.uuid4()),
                enterprise_id=enterprise_id,
                action="fact_check",
                agent_name=AGENT_NAME,
                details=f"Checked content ({len(content_text)} chars), issues: {len(result.get('issues', []))}",
            ))
            db.commit()

            return result
        except Exception as e:
            return {"content_ok": True, "issues": [], "summary": f"Check failed: {str(e)}"}

    def import_facts_csv(self, db: Session, enterprise_id: str, csv_text: str) -> dict:
        """Bulk import facts from CSV (category,key,value,source)."""
        reader = csv.DictReader(io.StringIO(csv_text))
        imported = 0
        for row in reader:
            if "key" in row and "value" in row:
                self.upsert_fact(
                    db, enterprise_id,
                    category=row.get("category", "general"),
                    key=row["key"],
                    value=row["value"],
                    source=row.get("source", "csv_import"),
                )
                imported += 1
        return {"imported": imported}

    def get_facts_for_agent(self, db: Session, enterprise_id: str) -> str:
        """Return facts as a formatted string for agent prompt injection."""
        facts = self.get_facts(db, enterprise_id)
        if not facts:
            return ""

        db.add(AuditLog(
            id=str(uuid.uuid4()),
            enterprise_id=enterprise_id,
            action="fact_read",
            agent_name="orchestrator",
            details=f"Facts retrieved for agent context ({len(facts)} facts)",
        ))
        db.commit()

        parts = []
        current_cat = ""
        for f in facts:
            if f["category"] != current_cat:
                current_cat = f["category"]
                parts.append(f"\n[{current_cat.upper()}]")
            parts.append(f"  {f['key']}: {f['value']}")
        return "\n".join(parts)

    def _to_dict(self, f: FactRecord) -> dict:
        return {
            "id": f.id,
            "enterprise_id": f.enterprise_id,
            "category": f.category,
            "key": f.key,
            "value": f.value,
            "source": f.source,
            "is_stale": f.is_stale,
            "last_verified_at": str(f.last_verified_at),
            "created_at": str(f.created_at),
        }
