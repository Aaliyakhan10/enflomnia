import json
import boto3
from typing import Optional
from app.config import get_settings

settings = get_settings()


class BedrockClient:
    """Wrapper for Amazon Bedrock invocations using the unified Converse API."""

    def __init__(self):
        self.client = boto3.client(
            "bedrock-runtime",
            region_name=settings.aws_region,
            aws_access_key_id=settings.aws_access_key_id or None,
            aws_secret_access_key=settings.aws_secret_access_key or None,
            aws_session_token=settings.aws_session_token or None,
        )
        self.model_id = settings.bedrock_model_id

    def invoke_claude(self, prompt: str, system: Optional[str] = None, max_tokens: int = 1024) -> str:
        """
        Invoke the configured Bedrock model (Nova/Claude) using Converse API and return text.
        """
        messages = [{"role": "user", "content": [{"text": prompt}]}]
        
        system_prompts = []
        if system:
            system_prompts = [{"text": system}]

        print("="*50)
        print(f"[DEBUG] Invoking Bedrock Model: {self.model_id}")
        print(f"[DEBUG] Region: {settings.aws_region}")
        print(f"[DEBUG] Messages: {json.dumps(messages, indent=2)}")
        print(f"[DEBUG] System Prompts: {json.dumps(system_prompts, indent=2)}")
        print(f"[DEBUG] Inference Config: {{'maxTokens': {max_tokens}}}")
        print("="*50)
        
        try:
            response = self.client.converse(
                modelId=self.model_id,
                messages=messages,
                system=system_prompts,
                inferenceConfig={"maxTokens": max_tokens},
            )
            return response["output"]["message"]["content"][0]["text"]
        except Exception as e:
            print(f"[ERROR] Bedrock Invocation Failed: {repr(e)}")
            raise

    def invoke_claude_json(self, prompt: str, system: Optional[str] = None) -> dict:
        """Invoke model and parse the response as JSON."""
        raw = self.invoke_claude(prompt, system, max_tokens=1024)
        # Strip markdown code fences if present
        raw = raw.strip()
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        try:
            return json.loads(raw.strip())
        except json.JSONDecodeError as e:
            print(f"[ERROR] JSON Decode Error on response: {raw}")
            raise e
