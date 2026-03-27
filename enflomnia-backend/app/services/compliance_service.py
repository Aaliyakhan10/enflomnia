import json
from sqlalchemy.orm import Session
from app.models.fact_record import FactRecord
from app.integrations.gemini_client import GeminiClient
from app.services.data_guard import DataGuardService

class ComplianceService:
    def __init__(self, db: Session):
        self.db = db
        self.gemini = GeminiClient()
        self.guard = DataGuardService()

    def audit_content(self, enterprise_id: str, content: str, content_type: str) -> dict:
        """
        The Aegis 'Bark' Check: Scans visual or text content against the Enterprise's Brand DNA.
        """
        # 1. Log the audit request for compliance tracking
        self.guard.audit_log(self.db, enterprise_id, action=f"Aegis Compliance Scan: {content_type}", agent_name="Aegis")

        # 2. Retrieve Brand DNA and Legal Facts
        facts = self.db.query(FactRecord).filter(
            FactRecord.enterprise_id == enterprise_id,
            FactRecord.is_stale == False
        ).all()
        
        rules = []
        for f in facts:
            if "compliance" in f.category.lower() or "brand" in f.category.lower() or "legal" in f.category.lower():
                rules.append(f"- {f.category}: {f.value}")
        
        # We also include all general facts to ensure no hallucinated claims
        general_facts = [f"- {f.key}: {f.value}" for f in facts]
        
        brand_dna = "\n".join(rules) if rules else "Maintain professional, helpful corporate tone."
        all_facts = "\n".join(general_facts) if general_facts else "No specific claims available."

        # 3. Call Aegis to audit
        prompt = f"""
You are Aegis, the strict Compliance and Brand Safety AI for the enterprise.
You must review the following proposed {content_type} to ensure it contains NO hallucinated claims and strictly adheres to the Brand DNA/Legal rules.

# BRAND DNA & LEGAL RULES
{brand_dna}

# VERIFIED ENTERPRISE FACTS
{all_facts}

# CONTENT TO REVIEW
{content}

# INSTRUCTIONS
If the content violates ANY rules, uses unverified claims, or has off-brand tone, you must REJECT it and provide the exact issues and a suggested correction. If it is 100% compliant, APPROVE it.

Respond EXACTLY in this JSON format without markdown ticks:
{{
  "status": "APPROVED" | "REJECTED",
  "issues": ["List of specific violations, empty if none"],
  "suggested_edits": "A rewritten compliant version, or empty if approved",
  "confidence_score": 0-100
}}
"""
        try:
            parsed = self.gemini.invoke_model_json(prompt, agent_name="aegis_compliance")
            
            # Ensure proper shape
            if not isinstance(parsed, dict) or "status" not in parsed:
                raise ValueError("Parsed JSON does not match expected Compliance structure.")
            
            return {
                "status": parsed.get("status", "REJECTED").upper(),
                "issues": parsed.get("issues", []),
                "suggested_edits": parsed.get("suggested_edits", ""),
                "confidence_score": parsed.get("confidence_score", 0)
            }
        except Exception as e:
            print("Aegis Compliance Exception:", e)
            return {
                "status": "REJECTED",
                "issues": ["Aegis failed to parse compliance check."],
                "suggested_edits": "Please manually review this piece of content.",
                "confidence_score": 0
            }
