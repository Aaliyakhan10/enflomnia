import json
import boto3
from typing import Optional
from app.config import get_settings

settings = get_settings()


class BedrockClient:
    """Wrapper for Amazon Bedrock Claude 3.5 Sonnet invocations."""

    def __init__(self):
        self.client = boto3.client(
            "bedrock-runtime",
            region_name=settings.aws_region,
            aws_access_key_id=settings.aws_access_key_id or None,
            aws_secret_access_key=settings.aws_secret_access_key or None,
        )
        self.model_id = settings.bedrock_model_id

    def invoke_claude(self, prompt: str, system: Optional[str] = None, max_tokens: int = 1024) -> str:
        """
        Invoke Claude 3.5 Sonnet and return the text response.
        """
        messages = [{"role": "user", "content": prompt}]
        body = {
            "anthropic_version": "bedrock-2023-05-31",
            "max_tokens": max_tokens,
            "messages": messages,
        }
        if system:
            body["system"] = system

        response = self.client.invoke_model(
            modelId=self.model_id,
            contentType="application/json",
            accept="application/json",
            body=json.dumps(body),
        )
        result = json.loads(response["body"].read())
        return result["content"][0]["text"]

    def invoke_claude_json(self, prompt: str, system: Optional[str] = None) -> dict:
        """Invoke Claude and parse the response as JSON."""
        raw = self.invoke_claude(prompt, system, max_tokens=1024)
        # Strip markdown code fences if present
        raw = raw.strip()
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        return json.loads(raw.strip())
