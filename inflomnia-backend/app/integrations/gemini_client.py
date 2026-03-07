import json
import re
from typing import Optional
from google import genai
from google.genai import types
from app.config import get_settings

settings = get_settings()


import os
from dotenv import load_dotenv

# Force load the .env file into standard os.environ
load_dotenv()

class GeminiClient:
    """Wrapper for Google Gemini API invocations using the `google-genai` SDK."""

    def __init__(self):
        # We assume the user has either set GEMINI_API_KEY in the environment
        # or we read it from settings.
        self.api_key = settings.gemini_api_key or os.environ.get("GEMINI_API_KEY")
        self.model_id = settings.gemini_model_id
        
        if not self.api_key:
            print("[WARNING] No Gemini API key found in .env or settings. API calls will fail.")
            
        # Initialize the GenAI client
        self.client = genai.Client(api_key=self.api_key)

    def invoke_model(self, prompt: str, system: Optional[str] = None, max_tokens: int = 1024) -> str:
        """
        Invoke the configured Gemini model using the GenAI SDK and return text.
        """
        
        # Configure model parameters
        config = types.GenerateContentConfig(
            max_output_tokens=max_tokens,
        )
        
        if system:
            config.system_instruction = system

        print("="*50)
        print(f"[DEBUG] Invoking Gemini Model: {self.model_id}")
        if system:
            print(f"[DEBUG] System Prompt: {system[:200]}...")
        print(f"[DEBUG] User Prompt: {prompt[:200]}...")
        print(f"[DEBUG] Inference Config: max_output_tokens={max_tokens}")
        print("="*50)
        
        try:
            response = self.client.models.generate_content(
                model=self.model_id,
                contents=prompt,
                config=config,
            )
            return response.text
        except Exception as e:
            print(f"[ERROR] Gemini Invocation Failed: {repr(e)}")
            raise

    def invoke_model_json(self, prompt: str, system: Optional[str] = None) -> dict:
        """Invoke model and parse the response as JSON. We configure the model to output JSON."""
        
        config_args = {
            "max_output_tokens": 4096,
        }
        
        if system:
            config_args["system_instruction"] = system
            
        config = types.GenerateContentConfig(**config_args)

        print("="*50)
        print(f"[DEBUG] Invoking Gemini Model (JSON Base): {self.model_id}")
        print("="*50)

        try:
            response = self.client.models.generate_content(
                model=self.model_id,
                contents=prompt,
                config=config,
            )
            raw = response.text
            
            # Clean up the output if the model still wrapped it in markdown
            raw = raw.strip()
            
            # Find the first { and the last }
            start_idx = raw.find('{')
            end_idx = raw.rfind('}')
            
            if start_idx != -1 and end_idx != -1 and end_idx >= start_idx:
                raw = raw[start_idx:end_idx+1]
            
            return json.loads(raw)
        except json.JSONDecodeError as e:
            print(f"[ERROR] JSON Decode Error on response: {raw if 'raw' in locals() else 'N/A'}")
            raise e
        except Exception as e:
            print(f"[ERROR] Gemini JSON Invocation Failed: {repr(e)}")
            raise e

