import json
import uuid
import boto3
from dataclasses import dataclass
from app.config import get_settings

settings = get_settings()


@dataclass
class GuardrailResult:
    blocked: bool
    category: str  # HATE | INSULTS | SEXUAL | VIOLENCE | MISCONDUCT | NONE
    confidence: float
    masked_text: str


class GuardrailsClient:
    """
    Wrapper for Amazon Bedrock Guardrails.
    Applies toxicity detection and PII masking.
    """

    def __init__(self):
        self.client = boto3.client(
            "bedrock-runtime",
            region_name=settings.aws_region,
            aws_access_key_id=settings.aws_access_key_id or None,
            aws_secret_access_key=settings.aws_secret_access_key or None,
        )
        self.guardrail_id = settings.bedrock_guardrail_id
        self.guardrail_version = settings.bedrock_guardrail_version

    def apply(self, text: str) -> GuardrailResult:
        """
        Apply guardrail to text. Returns blocked status, category, and masked text.
        """
        if not self.guardrail_id:
            # Dev mode: fallback mock
            return GuardrailResult(blocked=False, category="NONE", confidence=0.0, masked_text=text)

        try:
            response = self.client.apply_guardrail(
                guardrailIdentifier=self.guardrail_id,
                guardrailVersion=self.guardrail_version,
                source="INPUT",
                content=[{"text": {"text": text}}],
            )
            action = response.get("action", "NONE")
            blocked = action == "GUARDRAIL_INTERVENED"

            # Extract the top category from assessments
            category = "NONE"
            confidence = 0.0
            assessments = response.get("assessments", [])
            for assessment in assessments:
                topic_policy = assessment.get("topicPolicy", {})
                for topic in topic_policy.get("topics", []):
                    if topic.get("action") == "BLOCKED":
                        category = topic.get("name", "TOXIC")
                        confidence = 0.95
                        break

            # Get masked output text if available
            masked_text = text
            outputs = response.get("outputs", [])
            if outputs:
                masked_text = outputs[0].get("text", text)

            return GuardrailResult(
                blocked=blocked,
                category=category,
                confidence=confidence,
                masked_text=masked_text,
            )
        except Exception as e:
            # Graceful fallback
            return GuardrailResult(blocked=False, category="NONE", confidence=0.0, masked_text=text)
