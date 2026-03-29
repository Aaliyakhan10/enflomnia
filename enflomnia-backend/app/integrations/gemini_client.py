import json
import re
import time
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
    """Wrapper for Google Gemini API invocations with Langfuse observability."""

    def __init__(self):
        self.api_key = settings.gemini_api_key or os.environ.get("GEMINI_API_KEY")
        self.model_id = settings.gemini_model_id

        if not self.api_key:
            print("[WARNING] No Gemini API key found in .env or settings. API calls will fail.")

        # Initialize the GenAI client
        self.client = genai.Client(api_key=self.api_key)

        # Initialize Langfuse (lazy — won't crash if not configured)
        self._langfuse = None
        try:
            from app.integrations.langfuse_client import get_langfuse
            self._langfuse = get_langfuse()
        except Exception:
            pass

    def _trace_generation(self, trace_name: str, model: str, prompt: str,
                          system: Optional[str], completion: str, duration_ms: float,
                          agent_name: str = "enflomnia", session_id: Optional[str] = None):
        """Log a generation event to Langfuse."""
        if not self._langfuse:
            return
        try:
            trace = self._langfuse.trace(
                name=trace_name, 
                metadata={"agent": agent_name},
                session_id=session_id
            )
            trace.generation(
                name=f"{agent_name}:{trace_name}",
                model=model,
                input={"system": system or "", "user": prompt[:2000]},
                output=completion[:2000],
                metadata={"agent": agent_name, "duration_ms": round(duration_ms, 1)},
            )
        except Exception as e:
            print(f"[LANGFUSE] Tracing failed (non-fatal): {e}")

    def invoke_model(self, prompt: str, system: Optional[str] = None,
                     max_tokens: int = 1024, agent_name: str = "enflomnia",
                     session_id: Optional[str] = None) -> str:
        """Invoke the configured Gemini model and return text. Traced via Langfuse."""
        config = types.GenerateContentConfig(max_output_tokens=max_tokens)
        if system:
            config.system_instruction = system

        start = time.time()
        try:
            response = self.client.models.generate_content(
                model=self.model_id,
                contents=prompt,
                config=config,
            )
            completion = response.text
            duration_ms = (time.time() - start) * 1000

            # Langfuse trace
            self._trace_generation("invoke_model", self.model_id, prompt, system,
                                   completion, duration_ms, agent_name, session_id=session_id)
            return completion
        except Exception as e:
            print(f"[ERROR] Gemini Invocation Failed: {repr(e)}")
            raise

    def invoke_model_json(self, prompt: str, system: Optional[str] = None,
                          agent_name: str = "enflomnia", session_id: Optional[str] = None) -> dict:
        """Invoke model and parse the response as JSON. Traced via Langfuse."""
        config_args = {
            "max_output_tokens": 4096,
            "response_mime_type": "application/json",
        }
        if system:
            config_args["system_instruction"] = system
        config = types.GenerateContentConfig(**config_args)

        start = time.time()
        try:
            response = self.client.models.generate_content(
                model=self.model_id,
                contents=prompt,
                config=config,
            )
            raw = response.text
            duration_ms = (time.time() - start) * 1000

            # Langfuse trace
            self._trace_generation("invoke_model_json", self.model_id, prompt, system,
                                   raw[:2000], duration_ms, agent_name, session_id=session_id)

            # ── Step 1: Strip markdown code fences if present
            raw = raw.strip()
            if raw.startswith("```"):
                raw = re.sub(r"^```[a-zA-Z]*\n?", "", raw)
                raw = re.sub(r"\n?```$", "", raw)
                raw = raw.strip()

            # ── Step 2: Extract outermost [ ... ] or { ... }
            bracket_idx = raw.find('[')
            brace_idx = raw.find('{')

            if bracket_idx == -1 and brace_idx == -1:
                raise json.JSONDecodeError("No JSON structure found", raw, 0)

            if bracket_idx != -1 and (brace_idx == -1 or bracket_idx < brace_idx):
                end_idx = raw.rfind(']')
                if end_idx == -1:
                    raise json.JSONDecodeError("No closing ] found", raw, 0)
                raw = raw[bracket_idx:end_idx + 1]
            else:
                end_idx = raw.rfind('}')
                if end_idx == -1:
                    raise json.JSONDecodeError("No closing } found", raw, 0)
                raw = raw[brace_idx:end_idx + 1]

            # ── Step 3: Strip trailing commas
            raw = re.sub(r",\s*([\]}])", r"\1", raw)

            # ── Step 4: Repair truncation if necessary
            try:
                return json.loads(raw)
            except json.JSONDecodeError:
                repaired = self._repair_json(raw)
                return json.loads(repaired)
        except json.JSONDecodeError as e:
            print(f"[ERROR] JSON Decode Error on response: {raw if 'raw' in locals() else 'N/A'}")
            raise e
        except Exception as e:
            print(f"[ERROR] Gemini JSON Invocation Failed: {repr(e)}")
            raise e

    def generate_image(self, prompt: str, aspect_ratio: str = "1:1",
                       number_of_images: int = 1, agent_name: str = "image_studio") -> list:
        """Invoke Gemini Imagen and return a list of {image_data, caption} dicts."""
        import base64
        number_of_images = max(1, min(4, number_of_images))
        start = time.time()
        try:
            result = self.client.models.generate_images(
                model='imagen-4.0-generate-001',
                prompt=prompt,
                config=types.GenerateImagesConfig(
                    number_of_images=number_of_images,
                    output_mime_type="image/jpeg",
                    aspect_ratio=aspect_ratio
                )
            )
            if not getattr(result, 'generated_images', None):
                raise Exception("No image generated by the API.")

            images = []
            for idx, gen_img in enumerate(result.generated_images):
                image_bytes = gen_img.image.image_bytes
                base64_str = base64.b64encode(image_bytes).decode('utf-8')
                data_url = f"data:image/jpeg;base64,{base64_str}"

                # Generate AI caption for this image
                caption = self._generate_caption_for_image(prompt, idx + 1, number_of_images)
                images.append({"image_data": data_url, "caption": caption})

            return images
        except Exception as e:
            print(f"[ERROR] Gemini Image Invocation Failed: {repr(e)}")
            raise e

    def _generate_caption_for_image(self, prompt: str, index: int, total: int) -> str:
        """Generate a short, social-media-ready caption for a generated image."""
        try:
            caption = self.invoke_model(
                f"""Generate a short, engaging social-media caption (max 2 sentences) for an AI-generated image.
The image was generated from this prompt: "{prompt}"
This is image {index} of {total}.
Return ONLY the caption text, no quotes or extra formatting.""",
                max_tokens=100, agent_name="caption_gen",
            )
            return caption.strip().strip('"')
        except Exception:
            return f"AI-generated creative based on: {prompt[:80]}"

    def generate_caption(self, description: str, content_type: str = "video",
                         agent_name: str = "caption_gen") -> str:
        """Generate a caption for any content (video, image, etc.) given a description."""
        try:
            caption = self.invoke_model(
                f"""Generate an engaging, professional social-media caption for a {content_type}.
Description: {description}
Requirements:
- 2-3 sentences max
- Include 2-3 relevant hashtags
- Be compelling and brand-appropriate
Return ONLY the caption text.""",
                max_tokens=200, agent_name=agent_name,
            )
            return caption.strip()
        except Exception:
            return f"Check out this amazing {content_type}! #content #creative"

    def _repair_json(self, s: str) -> str:
        """Attempts to close unclosed JSON structures by balancing delimiters."""
        s = s.strip()
        stack = []
        for char in s:
            if char in "{[":
                stack.append(char)
            elif char in "}]":
                if not stack:
                    continue
                stack.pop()

        while stack:
            opener = stack.pop()
            if opener == "{":
                s += "}"
            elif opener == "[":
                s += "]"
        return s
