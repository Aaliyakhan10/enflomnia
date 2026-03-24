"""
Langfuse Client — LLM Observability Layer
Provides a singleton Langfuse instance for tracing all LLM calls.
Gracefully degrades if langfuse is not importable.
"""
from functools import lru_cache
from app.config import get_settings


class _NoOpLangfuse:
    """Stub that silently does nothing when Langfuse is unavailable."""
    def trace(self, **kwargs):
        return _NoOpTrace()
    def flush(self):
        pass

class _NoOpTrace:
    def span(self, **kwargs):
        return _NoOpSpan()
    def generation(self, **kwargs):
        pass
    def update(self, **kwargs):
        pass

class _NoOpSpan:
    def end(self, **kwargs):
        pass


@lru_cache()
def get_langfuse():
    """Return a Langfuse client, or a no-op stub if unavailable."""
    settings = get_settings()

    if not settings.langfuse_public_key or not settings.langfuse_secret_key:
        print("[LANGFUSE] No credentials configured. Tracing disabled.")
        return _NoOpLangfuse()

    try:
        from langfuse import Langfuse
        return Langfuse(
            public_key=settings.langfuse_public_key,
            secret_key=settings.langfuse_secret_key,
            host=settings.langfuse_host,
        )
    except ImportError:
        print("[LANGFUSE] langfuse package not importable. Tracing disabled.")
        return _NoOpLangfuse()
    except Exception as e:
        print(f"[LANGFUSE] Init failed ({e}). Tracing disabled.")
        return _NoOpLangfuse()
