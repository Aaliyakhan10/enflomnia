import json
import uuid
import boto3
from app.config import get_settings

settings = get_settings()


class BedrockAgentClient:
    """
    Wrapper for Amazon Bedrock Agents runtime.
    Used to invoke the Comment Shield Agent for multi-step orchestration.
    """

    def __init__(self):
        self.client = boto3.client(
            "bedrock-agent-runtime",
            region_name=settings.aws_region,
            aws_access_key_id=settings.aws_access_key_id or None,
            aws_secret_access_key=settings.aws_secret_access_key or None,
        )
        self.agent_id = settings.bedrock_agent_id
        self.agent_alias_id = settings.bedrock_agent_alias_id

    def invoke_agent(self, input_text: str, session_id: str = None) -> str:
        """
        Invoke the Bedrock Agent and return the full response text.
        Streams response chunks and concatenates.
        """
        if not self.agent_id or not self.agent_alias_id:
            return ""  # Not configured — caller will use fallback

        if session_id is None:
            session_id = str(uuid.uuid4())

        response = self.client.invoke_agent(
            agentId=self.agent_id,
            agentAliasId=self.agent_alias_id,
            sessionId=session_id,
            inputText=input_text,
        )

        full_response = ""
        event_stream = response.get("completion", [])
        for event in event_stream:
            chunk = event.get("chunk", {})
            if "bytes" in chunk:
                full_response += chunk["bytes"].decode("utf-8")

        return full_response
