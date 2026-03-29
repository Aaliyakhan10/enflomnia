"""
Creative Studio Service — Generates multi-modal brand assets.
Integrates Gemini for Images and Captions with Knowledge Lake grounding.
"""
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.integrations.gemini_client import GeminiClient
from app.models.image import GeneratedImage
from app.services.knowledge_lake import KnowledgeLakeService

class CreativeStudioService:
    def __init__(self, db: Session):
        self.db = db
        self.knowledge_svc = KnowledgeLakeService()
        self.client = GeminiClient()

    def generate_image(
        self, 
        enterprise_id: str, 
        prompt: str, 
        user_email: str,
        aspect_ratio: str = "1:1",
        count: int = 1
    ) -> Dict[str, Any]:
        """Synthesizes images grounded in enterprise context."""
        try:
            # 1. Context Retrieval (Information Grounding)
            context = self.knowledge_svc.get_context_for_agent(self.db, enterprise_id, "image generation")
            full_prompt = f"Context: {context}\n\nTask: Generate an image for {prompt}" if context else prompt
            
            # 2. AI Synthesis
            images = self.client.generate_image(
                prompt=full_prompt,
                aspect_ratio=aspect_ratio,
                number_of_images=count,
            )
            
            # 3. Persistence & Audit
            saved_images = []
            for img in images:
                new_img = GeneratedImage(
                    enterprise_id=enterprise_id,
                    user_email=user_email,
                    prompt=prompt,
                    image_data=img["image_data"],
                    caption=img["caption"]
                )
                self.db.add(new_img)
                saved_images.append({
                    "image_data": img["image_data"],
                    "caption": img["caption"]
                })
            
            self.db.commit()
            return {"images": saved_images, "prompt": prompt, "count": len(saved_images)}
            
        except Exception as e:
            # Re-raise standard exception for router to catch
            raise HTTPException(status_code=500, detail=f"Creative Studio Synthesis Failed: {str(e)}")

    def generate_caption(
        self, 
        enterprise_id: str, 
        description: str,
        content_type: str = "video"
    ) -> Dict[str, str]:
        """Generates brand-compliant captions grounded in context."""
        try:
            context = self.knowledge_svc.get_context_for_agent(self.db, enterprise_id, "caption generation")
            caption = self.client.generate_caption(
                description=description,
                content_type=content_type,
                context=context
            )
            return {"caption": caption, "content_type": content_type}
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Caption Synthesis Failed: {str(e)}")
