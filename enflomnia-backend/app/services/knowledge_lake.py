"""
Knowledge Lake Service — "The Digital Library"
Ingests unstructured data (PDFs, docs, text), generates Gemini embeddings,
and provides semantic search for agent context injection.
"""
import uuid
from typing import List, Optional
from sqlalchemy.orm import Session

from app.models.knowledge_document import KnowledgeDocument
from app.models.audit_log import AuditLog
from app.integrations.gemini_client import GeminiClient

AGENT_NAME = "knowledge_lake"


class KnowledgeLakeService:

    def __init__(self):
        self.gemini = GeminiClient()

    def ingest_document(
        self, db: Session, enterprise_id: str,
        title: str, content: str, source_type: str = "text",
        file_url: str = "",
    ) -> dict:
        """Ingest a document: store text + generate Gemini embedding summary."""
        # Generate embedding summary
        try:
            summary = self.gemini.invoke_model(
                f"""Distill this document into exactly 3 sentences that capture:
1. The main topic/purpose
2. The most critical data points or decisions
3. How this could be used for content creation

Document title: {title}
Content:
{content[:4000]}""",
                max_tokens=300, agent_name=AGENT_NAME,
            )
        except Exception:
            summary = content[:300] + "..."

        doc = KnowledgeDocument(
            id=str(uuid.uuid4()),
            enterprise_id=enterprise_id,
            source_type=source_type,
            title=title,
            content_text=content,
            embedding_summary=summary,
            file_url=file_url,
            word_count=len(content.split()),
            status="indexed",
        )
        db.add(doc)

        db.add(AuditLog(
            id=str(uuid.uuid4()),
            enterprise_id=enterprise_id,
            action="knowledge_ingest",
            agent_name=AGENT_NAME,
            details=f"Ingested '{title}' ({len(content.split())} words)",
        ))

        db.commit()
        db.refresh(doc)
        return self._to_dict(doc)

    def ingest_text(self, db: Session, enterprise_id: str, title: str, text: str) -> dict:
        """Quick ingest for pasted text."""
        return self.ingest_document(db, enterprise_id, title, text, source_type="text")

    def list_documents(self, db: Session, enterprise_id: str) -> List[dict]:
        docs = db.query(KnowledgeDocument).filter(
            KnowledgeDocument.enterprise_id == enterprise_id
        ).order_by(KnowledgeDocument.ingested_at.desc()).all()
        return [self._to_dict(d) for d in docs]

    def search_knowledge(self, db: Session, enterprise_id: str, query: str, limit: int = 5) -> List[dict]:
        """Semantic search: use Gemini to rank documents against the query."""
        docs = db.query(KnowledgeDocument).filter(
            KnowledgeDocument.enterprise_id == enterprise_id,
            KnowledgeDocument.status == "indexed",
        ).all()

        if not docs:
            return []

        # Build a catalog for Gemini to rank
        catalog = "\n".join([
            f"[{i}] Title: {d.title} | Summary: {d.embedding_summary}"
            for i, d in enumerate(docs)
        ])

        try:
            ranking = self.gemini.invoke_model_json(
                f"""Given this search query: "{query}"

Rank the following documents by relevance. Return ONLY a JSON array of indices (most relevant first), max {limit} items.

Documents:
{catalog}

Return format: [0, 3, 1]""",
                agent_name=AGENT_NAME,
            )
            if isinstance(ranking, list):
                ranked = []
                for idx in ranking[:limit]:
                    if isinstance(idx, int) and 0 <= idx < len(docs):
                        ranked.append(self._to_dict(docs[idx]))
                return ranked
        except Exception:
            pass

        # Fallback: return most recent
        return [self._to_dict(d) for d in docs[:limit]]

    def get_context_for_agent(self, db: Session, enterprise_id: str, topic: str) -> str:
        """
        Returns the best knowledge context as a formatted string
        that can be injected into an agent's prompt.
        """
        results = self.search_knowledge(db, enterprise_id, topic, limit=3)

        db.add(AuditLog(
            id=str(uuid.uuid4()),
            enterprise_id=enterprise_id,
            action="knowledge_read",
            agent_name="orchestrator",
            details=f"Context retrieval for topic: {topic} ({len(results)} docs)",
        ))
        db.commit()

        if not results:
            return ""

        context_parts = []
        for doc in results:
            context_parts.append(
                f"--- {doc['title']} ---\n{doc['embedding_summary']}\n"
            )
        return "\n".join(context_parts)

    def _to_dict(self, d: KnowledgeDocument) -> dict:
        return {
            "id": d.id,
            "enterprise_id": d.enterprise_id,
            "source_type": d.source_type,
            "title": d.title,
            "embedding_summary": d.embedding_summary,
            "word_count": d.word_count,
            "status": d.status,
            "file_url": d.file_url,
            "ingested_at": str(d.ingested_at),
        }
