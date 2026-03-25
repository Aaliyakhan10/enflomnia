from sqlalchemy.orm import Session
from app.integrations.gemini_client import GeminiClient
from app.services.fact_database import FactDatabaseService
from app.services.data_guard import DataGuardService
from datetime import datetime
import json

class ListenerService:
    def __init__(self, db: Session):
        self.db = db
        self.gemini = GeminiClient()
        self.fact_svc = FactDatabaseService()
        self.guard = DataGuardService(db)

    def process_engagement_webhook(self, enterprise_id: str, payload: dict) -> dict:
        """
        The Nutrient Cycle: Receives raw social media comments/engagement data,
        analyzes it for actionable insights via AI, and writes these insights back
        as 'Facts' to influence the next Campaign Strategist generation.
        """
        self.guard.log_access(enterprise_id, "Incoming Instagram Webhook (Pulse)", "The Listener")

        # Extract data
        post_id = payload.get("post_id", "unknown_post")
        comments = payload.get("comments", [])
        metrics = payload.get("metrics", {})

        if not comments and not metrics:
            return {"status": "ignored", "reason": "No actionable data in webhook."}

        # Format input for AI
        data_dump = f"Post ID: {post_id}\nMetrics: {json.dumps(metrics)}\nComments:\n"
        for c in comments:
            data_dump += f"- User: {c.get('user')}, Comment: '{c.get('text')}'\n"

        prompt = f"""
You are "Pulse", the Enflomnia Data Insights Agent.
Review the following social media engagement data for a recent post.
Your job is to extract 1 or 2 high-level, actionable "Nutrients" (insights) that should influence the next marketing campaign.
For example, if multiple users ask about pricing, the insight should be "Users are confused about pricing, include transparent pricing upfront next time." or if they love a specific visual style, "Double down on fast-paced hook styles."

DATA LOG:
{data_dump}

Respond EXACTLY in this JSON format without markdown ticks or wrapping:
{{
  "insights": [
    {{
      "category": "audience_feedback",
      "key": "A short 2-3 word summary key",
      "value": "The actionable insight learned from the data."
    }}
  ]
}}
"""
        generated_facts_count = 0
        try:
            parsed = self.gemini.invoke_model_json(prompt, agent_name="pulse_listener")
            insights = parsed.get("insights", [])

            for insight in insights:
                cat = "Campaign Strategy Lesson"
                key = insight.get("key", "General Feedback")
                val = insight.get("value", "No clear value.")
                
                # Write back into Fact Database (Closing the loop!)
                source = f"Pulse AI Insight from Post {post_id} at {datetime.now().strftime('%Y-%m-%d')}"
                self.fact_svc.upsert_fact(self.db, enterprise_id, cat, key, val, source)
                generated_facts_count += 1

            return {
                "status": "success",
                "message": "Nutrient Loop complete.",
                "facts_generated": generated_facts_count,
                "parsed_data": insights
            }
        except Exception as e:
            print("Pulse AI Listener Error:", e)
            return {"status": "error", "message": "Failed to extract insights from engagement loop."}
