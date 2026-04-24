"""
BRX SYSTEM - Models API Routes
LLM provider and model management
"""

from typing import Any, Dict, List
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from src.core.llm.provider import LLMProvider
from src.core.logging import get_logger

logger = get_logger(__name__)

router = APIRouter()


class ChatRequest(BaseModel):
    messages: List[Dict[str, str]]
    model: str
    provider: str = "ollama"
    temperature: float = 0.7
    max_tokens: int = 4096
    stream: bool = False


class EmbedRequest(BaseModel):
    texts: List[str]
    model: str = "sentence-transformers/all-MiniLM-L6-v2"
    provider: str = "huggingface"


@router.get("/providers")
async def list_providers():
    """List available LLM providers."""
    return {
        "providers": LLMProvider.list_available_providers(),
    }


@router.get("/list")
async def list_models():
    """List all available models across providers."""
    try:
        models = LLMProvider.list_all_models()
        return {"models": models, "count": len(models)}
    except Exception as e:
        logger.error("list_models_failed", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/provider/{provider_name}/models")
async def list_provider_models(provider_name: str):
    """List models for a specific provider."""
    try:
        provider = LLMProvider.get_provider(provider_name)
        models = provider.list_models()
        return {"provider": provider_name, "models": models}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/chat")
async def chat_completion(request: ChatRequest):
    """Send chat completion request."""
    try:
        provider = LLMProvider.get_provider(request.provider)

        from src.core.llm.provider import LLMMessage
        messages = [LLMMessage(role=m["role"], content=m["content"]) for m in request.messages]

        response = await provider.chat(
            messages=messages,
            model=request.model,
            temperature=request.temperature,
            max_tokens=request.max_tokens,
        )

        return {
            "content": response.content,
            "model": response.model,
            "tokens_used": response.tokens_used,
            "tokens_prompt": response.tokens_prompt,
            "tokens_completion": response.tokens_completion,
            "finish_reason": response.finish_reason,
        }
    except Exception as e:
        logger.error("chat_failed", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/embed")
async def create_embeddings(request: EmbedRequest):
    """Generate embeddings for texts."""
    try:
        provider = LLMProvider.get_provider(request.provider)
        embeddings = await provider.embed(request.texts, request.model)

        return {
            "embeddings": embeddings,
            "count": len(embeddings),
            "dimensions": len(embeddings[0]) if embeddings else 0,
            "model": request.model,
        }
    except Exception as e:
        logger.error("embed_failed", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))
