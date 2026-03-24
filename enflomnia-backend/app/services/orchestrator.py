"""
Enflomnia Orchestrator — Unified Agentic Pipeline
Chains all 5 pillars into a single Content Loop:
  DNA & Soil → The Alchemist → The Aegis → The Pulse → System Pulse

Each step is traced via Langfuse as a span within a parent trace.
"""
import time
from typing import Optional
from sqlalchemy.orm import Session

from app.integrations.langfuse_client import get_langfuse
from app.services.prediction_service import PredictionService
from app.services.script_service import ScriptService
from app.services.comment_shield import CommentShieldService
from app.services.workload_signal import WorkloadSignalService
from app.services.reach_anomaly import ReachAnomalyService
from app.services.scheduler_service import SchedulerService
from app.services.knowledge_lake import KnowledgeLakeService
from app.services.fact_database import FactDatabaseService


class Orchestrator:
    """
    Central dispatcher that runs the Enflomnia Content Nervous System loop.
    Each agent is a phase in the pipeline, and the output of one feeds the next.
    """

    def __init__(self):
        self.dna_soil = PredictionService()       # The DNA & Soil
        self.alchemist = ScriptService()           # The Alchemist
        self.aegis = CommentShieldService()        # The Aegis
        self.pulse = WorkloadSignalService()       # The Pulse
        self.system_pulse = ReachAnomalyService()  # System Pulse
        self.scheduler = SchedulerService()        # Loop Scheduler
        self.knowledge_lake = KnowledgeLakeService()  # Knowledge Lake
        self.fact_db = FactDatabaseService()           # Fact Database
        self.langfuse = get_langfuse()

    def run_content_loop(
        self,
        db: Session,
        creator_id: str,
        topic: Optional[str] = None,
        tone: str = "entertaining",
        enterprise_id: Optional[str] = None,
    ) -> dict:
        """
        Execute the full Content Nervous System loop:
        0. Knowledge Grounding — Pull enterprise context (Knowledge Lake + Facts)
        1. DNA & Soil   — Extract knowledge, generate content suggestions
        2. Alchemist    — Generate a script/narrative from the suggestion
        3. Aegis        — Compliance-check the generated content
        4. Pulse        — Determine optimal posting schedule
        5. System Pulse — Check for reach anomalies

        Returns a unified result dict with outputs from each agent.
        """
        trace = self.langfuse.trace(
            name="content_loop",
            metadata={"creator_id": creator_id, "topic": topic or "auto", "enterprise_id": enterprise_id},
        )
        results = {}
        loop_start = time.time()
        enterprise_context = ""

        # ── Phase 0: Knowledge Grounding (Enterprise Data) ─────────────────
        if enterprise_id:
            span_ground = trace.span(name="knowledge_grounding", metadata={"agent": "knowledge_lake"})
            try:
                knowledge_ctx = self.knowledge_lake.get_context_for_agent(db, enterprise_id, topic or "general")
                facts_ctx = self.fact_db.get_facts_for_agent(db, enterprise_id)
                enterprise_context = ""
                if knowledge_ctx:
                    enterprise_context += f"\n--- ENTERPRISE KNOWLEDGE ---\n{knowledge_ctx}\n"
                if facts_ctx:
                    enterprise_context += f"\n--- ENTERPRISE FACTS ---\n{facts_ctx}\n"
                results["knowledge_grounding"] = {
                    "status": "ok",
                    "knowledge_docs": len(knowledge_ctx.split('---')) // 2 if knowledge_ctx else 0,
                    "facts_loaded": len(facts_ctx.split('\n')) if facts_ctx else 0,
                }
                span_ground.end(output=results["knowledge_grounding"])
            except Exception as e:
                results["knowledge_grounding"] = {"status": "error", "error": str(e)}
                span_ground.end(output={"error": str(e)})

        # ── Phase 1: DNA & Soil (Knowledge Extraction) ─────────────────────
        span_dna = trace.span(name="dna_soil", metadata={"agent": "dna_soil"})
        try:
            suggestions = self.dna_soil.generate_content_suggestions(db, creator_id)
            results["dna_soil"] = {
                "status": "ok",
                "suggestions": suggestions[:3] if suggestions else [],
            }
            # Pick best topic from suggestions if none provided
            if not topic and suggestions:
                topic = suggestions[0].get("title", "Enterprise Content")
            elif not topic:
                topic = "Enterprise Content Strategy"
            span_dna.end(output={"topic_selected": topic, "suggestions_count": len(suggestions or [])})
        except Exception as e:
            results["dna_soil"] = {"status": "error", "error": str(e)}
            topic = topic or "Enterprise Content Strategy"
            span_dna.end(output={"error": str(e)})

        # ── Phase 2: The Alchemist (Content Generation) ────────────────────
        span_alchemist = trace.span(name="alchemist", metadata={"agent": "alchemist"})
        try:
            script = self.alchemist.generate_script(
                db=db, creator_id=creator_id, topic=topic, tone=tone,
            )
            results["alchemist"] = {
                "status": "ok",
                "hook": script.get("hook", ""),
                "cta": script.get("cta", ""),
                "sections": len(script.get("structure", [])),
                "cached": script.get("cached", False),
            }
            span_alchemist.end(output={"hook": script.get("hook", ""), "cached": script.get("cached")})
        except Exception as e:
            results["alchemist"] = {"status": "error", "error": str(e)}
            span_alchemist.end(output={"error": str(e)})

        # ── Phase 3: The Aegis (Compliance Check) ──────────────────────────
        span_aegis = trace.span(name="aegis", metadata={"agent": "aegis"})
        try:
            # Run the generated hook + CTA through the Aegis safety filter
            content_to_check = f"{results.get('alchemist', {}).get('hook', '')} {results.get('alchemist', {}).get('cta', '')}"
            if content_to_check.strip():
                aegis_result = self.aegis.analyze_batch(db, creator_id, [
                    {"content": content_to_check, "author": "enflomnia-alchemist"}
                ])
                results["aegis"] = {
                    "status": "ok",
                    "compliance": aegis_result[0]["category"] if aegis_result else "unchecked",
                    "confidence": aegis_result[0]["confidence"] if aegis_result else 0,
                }
            else:
                results["aegis"] = {"status": "skipped", "reason": "no content to check"}
            span_aegis.end(output=results["aegis"])
        except Exception as e:
            results["aegis"] = {"status": "error", "error": str(e)}
            span_aegis.end(output={"error": str(e)})

        # ── Phase 4: The Pulse (Scheduling & Cadence) ──────────────────────
        span_pulse = trace.span(name="pulse", metadata={"agent": "pulse"})
        try:
            signal = self.pulse.analyze_and_generate(db, creator_id)
            results["pulse"] = {
                "status": "ok",
                "signal_type": signal.get("signal_type", "maintain"),
                "recommended_posts_per_week": signal.get("recommended_posts_per_week", 3),
                "best_days": signal.get("best_days", []),
            }
            span_pulse.end(output=results["pulse"])
        except Exception as e:
            results["pulse"] = {"status": "error", "error": str(e)}
            span_pulse.end(output={"error": str(e)})

        # ── Phase 5: System Pulse (Reach Anomaly Detection) ────────────────
        span_system = trace.span(name="system_pulse", metadata={"agent": "system_pulse"})
        try:
            anomaly = self.system_pulse.analyze(db, creator_id)
            results["system_pulse"] = {
                "status": "ok",
                "anomaly_type": anomaly.get("anomaly_type", "none"),
                "confidence": anomaly.get("confidence", 0),
                "reasoning": anomaly.get("reasoning", ""),
            }
            span_system.end(output=results["system_pulse"])
        except Exception as e:
            results["system_pulse"] = {"status": "error", "error": str(e)}
            span_system.end(output={"error": str(e)})

        # ── Finalize ───────────────────────────────────────────────────────
        total_ms = round((time.time() - loop_start) * 1000, 1)
        results["_meta"] = {
            "total_duration_ms": total_ms,
            "creator_id": creator_id,
            "topic": topic,
            "agents_run": 5,
            "agents_ok": sum(1 for k, v in results.items() if k != "_meta" and v.get("status") == "ok"),
        }
        trace.update(output=results["_meta"])

        return results
