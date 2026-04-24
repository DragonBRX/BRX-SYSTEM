"""
BRX SYSTEM - LLM Provider Abstraction Layer
Unified interface for multiple LLM providers: OpenAI, Anthropic, Google, Cohere, Ollama, HuggingFace
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Any, AsyncIterator, Dict, List, Optional
from enum import Enum

from src.core.logging import get_logger
from src.config.settings import get_settings

logger = get_logger(__name__)
settings = get_settings()


class ProviderType(Enum):
    """Supported LLM providers."""
    OPENAI = "openai"
    ANTHROPIC = "anthropic"
    GOOGLE = "google"
    COHERE = "cohere"
    OLLAMA = "ollama"
    HUGGINGFACE = "huggingface"
    CUSTOM = "custom"


@dataclass
class LLMMessage:
    """Message for LLM conversation."""
    role: str  # system, user, assistant, tool
    content: str
    name: Optional[str] = None
    tool_calls: Optional[List[Dict[str, Any]]] = None
    tool_call_id: Optional[str] = None


@dataclass
class LLMResponse:
    """Response from LLM."""
    content: str
    model: str
    tokens_used: int = 0
    tokens_prompt: int = 0
    tokens_completion: int = 0
    finish_reason: str = ""
    metadata: Dict[str, Any] = None
    
    def __post_init__(self):
        if self.metadata is None:
            self.metadata = {}


class BaseLLMProvider(ABC):
    """Base class for LLM providers."""
    
    def __init__(self, name: ProviderType, api_key: Optional[str] = None):
        self.name = name
        self.api_key = api_key
        self.logger = get_logger(f"llm.{name.value}")
        
    @abstractmethod
    async def chat(self, messages: List[LLMMessage], model: str, temperature: float = 0.7, max_tokens: int = 4096, **kwargs) -> LLMResponse:
        """Send chat completion request."""
        pass
    
    @abstractmethod
    async def stream_chat(self, messages: List[LLMMessage], model: str, temperature: float = 0.7, max_tokens: int = 4096, **kwargs) -> AsyncIterator[str]:
        """Stream chat completion."""
        pass
    
    @abstractmethod
    async def embed(self, texts: List[str], model: str, **kwargs) -> List[List[float]]:
        """Generate embeddings."""
        pass
    
    @abstractmethod
    def list_models(self) -> List[Dict[str, Any]]:
        """List available models."""
        pass


class OpenAIProvider(BaseLLMProvider):
    """OpenAI provider implementation."""
    
    def __init__(self):
        super().__init__(ProviderType.OPENAI, settings.OPENAI_API_KEY)
        self.client = None
        self._initialize_client()
        
    def _initialize_client(self):
        """Initialize OpenAI client."""
        try:
            import openai
            self.client = openai.AsyncOpenAI(api_key=self.api_key)
            self.logger.info("openai_client_initialized")
        except ImportError:
            self.logger.error("openai_package_not_found")
        
    async def chat(self, messages: List[LLMMessage], model: str, temperature: float = 0.7, max_tokens: int = 4096, **kwargs) -> LLMResponse:
        if not self.client:
            raise RuntimeError("OpenAI client not initialized")
            
        formatted_messages = [
            {"role": msg.role, "content": msg.content, **({"name": msg.name} if msg.name else {})}
            for msg in messages
        ]
        
        try:
            response = await self.client.chat.completions.create(
                model=model,
                messages=formatted_messages,
                temperature=temperature,
                max_tokens=max_tokens,
                **kwargs,
            )
            
            return LLMResponse(
                content=response.choices[0].message.content or "",
                model=model,
                tokens_used=response.usage.total_tokens,
                tokens_prompt=response.usage.prompt_tokens,
                tokens_completion=response.usage.completion_tokens,
                finish_reason=response.choices[0].finish_reason or "",
            )
        except Exception as e:
            self.logger.error("openai_chat_error", error=str(e))
            raise
    
    async def stream_chat(self, messages: List[LLMMessage], model: str, temperature: float = 0.7, max_tokens: int = 4096, **kwargs) -> AsyncIterator[str]:
        if not self.client:
            raise RuntimeError("OpenAI client not initialized")
            
        formatted_messages = [
            {"role": msg.role, "content": msg.content}
            for msg in messages
        ]
        
        try:
            stream = await self.client.chat.completions.create(
                model=model,
                messages=formatted_messages,
                temperature=temperature,
                max_tokens=max_tokens,
                stream=True,
                **kwargs,
            )
            
            async for chunk in stream:
                if chunk.choices[0].delta.content:
                    yield chunk.choices[0].delta.content
        except Exception as e:
            self.logger.error("openai_stream_error", error=str(e))
            raise
    
    async def embed(self, texts: List[str], model: str = "text-embedding-3-small", **kwargs) -> List[List[float]]:
        if not self.client:
            raise RuntimeError("OpenAI client not initialized")
            
        try:
            response = await self.client.embeddings.create(
                model=model,
                input=texts,
                **kwargs,
            )
            return [item.embedding for item in response.data]
        except Exception as e:
            self.logger.error("openai_embed_error", error=str(e))
            raise
    
    def list_models(self) -> List[Dict[str, Any]]:
        if not self.client:
            return []
        
        return [
            {"id": "gpt-4o", "name": "GPT-4o", "context": 128000, "provider": "openai"},
            {"id": "gpt-4o-mini", "name": "GPT-4o Mini", "context": 128000, "provider": "openai"},
            {"id": "gpt-4-turbo", "name": "GPT-4 Turbo", "context": 128000, "provider": "openai"},
            {"id": "gpt-3.5-turbo", "name": "GPT-3.5 Turbo", "context": 16385, "provider": "openai"},
            {"id": "text-embedding-3-large", "name": "Embedding Large", "context": 8192, "provider": "openai"},
            {"id": "text-embedding-3-small", "name": "Embedding Small", "context": 8192, "provider": "openai"},
        ]


class AnthropicProvider(BaseLLMProvider):
    """Anthropic Claude provider."""
    
    def __init__(self):
        super().__init__(ProviderType.ANTHROPIC, settings.ANTHROPIC_API_KEY)
        self.client = None
        self._initialize_client()
        
    def _initialize_client(self):
        try:
            import anthropic
            self.client = anthropic.AsyncAnthropic(api_key=self.api_key)
            self.logger.info("anthropic_client_initialized")
        except ImportError:
            self.logger.error("anthropic_package_not_found")
    
    async def chat(self, messages: List[LLMMessage], model: str, temperature: float = 0.7, max_tokens: int = 4096, **kwargs) -> LLMResponse:
        if not self.client:
            raise RuntimeError("Anthropic client not initialized")
            
        system_msg = next((msg.content for msg in messages if msg.role == "system"), "")
        conversation = [
            {"role": msg.role, "content": msg.content}
            for msg in messages if msg.role != "system"
        ]
        
        try:
            response = await self.client.messages.create(
                model=model,
                max_tokens=max_tokens,
                temperature=temperature,
                system=system_msg,
                messages=conversation,
                **kwargs,
            )
            
            return LLMResponse(
                content=response.content[0].text if response.content else "",
                model=model,
                tokens_used=response.usage.input_tokens + response.usage.output_tokens,
                tokens_prompt=response.usage.input_tokens,
                tokens_completion=response.usage.output_tokens,
                finish_reason=response.stop_reason or "",
            )
        except Exception as e:
            self.logger.error("anthropic_chat_error", error=str(e))
            raise
    
    async def stream_chat(self, messages: List[LLMMessage], model: str, temperature: float = 0.7, max_tokens: int = 4096, **kwargs) -> AsyncIterator[str]:
        if not self.client:
            raise RuntimeError("Anthropic client not initialized")
            
        system_msg = next((msg.content for msg in messages if msg.role == "system"), "")
        conversation = [
            {"role": msg.role, "content": msg.content}
            for msg in messages if msg.role != "system"
        ]
        
        try:
            stream = await self.client.messages.create(
                model=model,
                max_tokens=max_tokens,
                temperature=temperature,
                system=system_msg,
                messages=conversation,
                stream=True,
                **kwargs,
            )
            
            async for event in stream:
                if event.type == "content_block_delta" and event.delta.text:
                    yield event.delta.text
        except Exception as e:
            self.logger.error("anthropic_stream_error", error=str(e))
            raise
    
    async def embed(self, texts: List[str], model: str = "claude", **kwargs) -> List[List[float]]:
        raise NotImplementedError("Anthropic does not provide embeddings. Use another provider.")
    
    def list_models(self) -> List[Dict[str, Any]]:
        return [
            {"id": "claude-3-5-sonnet-20241022", "name": "Claude 3.5 Sonnet", "context": 200000, "provider": "anthropic"},
            {"id": "claude-3-opus-20240229", "name": "Claude 3 Opus", "context": 200000, "provider": "anthropic"},
            {"id": "claude-3-haiku-20240307", "name": "Claude 3 Haiku", "context": 200000, "provider": "anthropic"},
        ]


class OllamaProvider(BaseLLMProvider):
    """Ollama local LLM provider."""
    
    def __init__(self):
        super().__init__(ProviderType.OLLAMA)
        self.base_url = settings.OLLAMA_BASE_URL
        self.client = None
        self._initialize_client()
        
    def _initialize_client(self):
        try:
            import ollama
            self.client = ollama.AsyncClient(host=self.base_url)
            self.logger.info("ollama_client_initialized", base_url=self.base_url)
        except ImportError:
            self.logger.error("ollama_package_not_found")
    
    async def chat(self, messages: List[LLMMessage], model: str, temperature: float = 0.7, max_tokens: int = 4096, **kwargs) -> LLMResponse:
        if not self.client:
            raise RuntimeError("Ollama client not initialized")
            
        formatted_messages = [
            {"role": msg.role, "content": msg.content}
            for msg in messages
        ]
        
        try:
            response = await self.client.chat(
                model=model,
                messages=formatted_messages,
                options={
                    "temperature": temperature,
                    "num_predict": max_tokens,
                    **kwargs,
                },
            )
            
            return LLMResponse(
                content=response["message"]["content"],
                model=model,
                tokens_used=response.get("prompt_eval_count", 0) + response.get("eval_count", 0),
                tokens_prompt=response.get("prompt_eval_count", 0),
                tokens_completion=response.get("eval_count", 0),
                finish_reason="stop",
            )
        except Exception as e:
            self.logger.error("ollama_chat_error", error=str(e))
            raise
    
    async def stream_chat(self, messages: List[LLMMessage], model: str, temperature: float = 0.7, max_tokens: int = 4096, **kwargs) -> AsyncIterator[str]:
        if not self.client:
            raise RuntimeError("Ollama client not initialized")
            
        formatted_messages = [
            {"role": msg.role, "content": msg.content}
            for msg in messages
        ]
        
        try:
            stream = await self.client.chat(
                model=model,
                messages=formatted_messages,
                stream=True,
                options={
                    "temperature": temperature,
                    "num_predict": max_tokens,
                    **kwargs,
                },
            )
            
            async for chunk in stream:
                if "message" in chunk and "content" in chunk["message"]:
                    yield chunk["message"]["content"]
        except Exception as e:
            self.logger.error("ollama_stream_error", error=str(e))
            raise
    
    async def embed(self, texts: List[str], model: str, **kwargs) -> List[List[float]]:
        if not self.client:
            raise RuntimeError("Ollama client not initialized")
            
        embeddings = []
        for text in texts:
            try:
                response = await self.client.embeddings(
                    model=model or settings.OLLAMA_DEFAULT_MODEL,
                    prompt=text,
                )
                embeddings.append(response["embedding"])
            except Exception as e:
                self.logger.error("ollama_embed_error", error=str(e))
                raise
        return embeddings
    
    def list_models(self) -> List[Dict[str, Any]]:
        try:
            import ollama
            models = ollama.list()
            return [
                {"id": m["model"], "name": m["model"], "context": 32768, "provider": "ollama"}
                for m in models.get("models", [])
            ]
        except Exception:
            return [
                {"id": "llama3.2", "name": "Llama 3.2", "context": 32768, "provider": "ollama"},
                {"id": "llama3.1", "name": "Llama 3.1", "context": 128000, "provider": "ollama"},
                {"id": "mistral", "name": "Mistral", "context": 32768, "provider": "ollama"},
                {"id": "qwen2.5", "name": "Qwen 2.5", "context": 32768, "provider": "ollama"},
                {"id": "codellama", "name": "Code Llama", "context": 16384, "provider": "ollama"},
                {"id": "nomic-embed-text", "name": "Nomic Embed Text", "context": 2048, "provider": "ollama"},
                {"id": "mxbai-embed-large", "name": "MXBAI Embed Large", "context": 512, "provider": "ollama"},
            ]


class HuggingFaceProvider(BaseLLMProvider):
    """HuggingFace Transformers provider."""
    
    def __init__(self):
        super().__init__(ProviderType.HUGGINGFACE, settings.HUGGINGFACE_TOKEN)
        self.logger.info("huggingface_provider_initialized")
    
    async def chat(self, messages: List[LLMMessage], model: str, temperature: float = 0.7, max_tokens: int = 4096, **kwargs) -> LLMResponse:
        try:
            import transformers
            import torch
            
            # Load model and tokenizer
            tokenizer = transformers.AutoTokenizer.from_pretrained(model, token=self.api_key)
            model_instance = transformers.AutoModelForCausalLM.from_pretrained(
                model,
                token=self.api_key,
                torch_dtype=torch.float16 if torch.cuda.is_available() else torch.float32,
                device_map="auto" if torch.cuda.is_available() else None,
            )
            
            # Format messages
            prompt = tokenizer.apply_chat_template(
                [{"role": msg.role, "content": msg.content} for msg in messages],
                tokenize=False,
                add_generation_prompt=True,
            )
            
            inputs = tokenizer(prompt, return_tensors="pt")
            if torch.cuda.is_available():
                inputs = {k: v.cuda() for k, v in inputs.items()}
            
            outputs = model_instance.generate(
                **inputs,
                max_new_tokens=max_tokens,
                temperature=temperature,
                do_sample=temperature > 0,
                **kwargs,
            )
            
            response_text = tokenizer.decode(outputs[0], skip_special_tokens=True)
            
            return LLMResponse(
                content=response_text,
                model=model,
                tokens_used=outputs.shape[1],
                tokens_prompt=inputs["input_ids"].shape[1],
                tokens_completion=outputs.shape[1] - inputs["input_ids"].shape[1],
                finish_reason="stop",
            )
        except Exception as e:
            self.logger.error("hf_chat_error", error=str(e))
            raise
    
    async def stream_chat(self, messages: List[LLMMessage], model: str, temperature: float = 0.7, max_tokens: int = 4096, **kwargs) -> AsyncIterator[str]:
        raise NotImplementedError("Streaming not yet implemented for HuggingFace")
    
    async def embed(self, texts: List[str], model: str, **kwargs) -> List[List[float]]:
        try:
            from sentence_transformers import SentenceTransformer
            
            encoder = SentenceTransformer(model)
            embeddings = encoder.encode(texts, convert_to_numpy=True)
            return embeddings.tolist()
        except Exception as e:
            self.logger.error("hf_embed_error", error=str(e))
            raise
    
    def list_models(self) -> List[Dict[str, Any]]:
        return [
            {"id": "meta-llama/Llama-3.2-3B-Instruct", "name": "Llama 3.2 3B", "context": 32768, "provider": "huggingface"},
            {"id": "microsoft/Phi-3-mini-4k-instruct", "name": "Phi-3 Mini", "context": 4096, "provider": "huggingface"},
            {"id": "HuggingFaceH4/zephyr-7b-beta", "name": "Zephyr 7B", "context": 32768, "provider": "huggingface"},
            {"id": "sentence-transformers/all-MiniLM-L6-v2", "name": "MiniLM Embeddings", "context": 512, "provider": "huggingface"},
            {"id": "sentence-transformers/all-mpnet-base-v2", "name": "MPNet Embeddings", "context": 512, "provider": "huggingface"},
        ]


class LLMProvider:
    """Factory for LLM providers."""
    
    _providers: Dict[ProviderType, BaseLLMProvider] = {}
    
    @classmethod
    def get_provider(cls, provider_name: str) -> BaseLLMProvider:
        """Get or create provider instance."""
        provider_type = ProviderType(provider_name.lower())
        
        if provider_type not in cls._providers:
            if provider_type == ProviderType.OPENAI:
                cls._providers[provider_type] = OpenAIProvider()
            elif provider_type == ProviderType.ANTHROPIC:
                cls._providers[provider_type] = AnthropicProvider()
            elif provider_type == ProviderType.OLLAMA:
                cls._providers[provider_type] = OllamaProvider()
            elif provider_type == ProviderType.HUGGINGFACE:
                cls._providers[provider_type] = HuggingFaceProvider()
            else:
                raise ValueError(f"Provider '{provider_name}' not supported")
        
        return cls._providers[provider_type]
    
    @classmethod
    def list_available_providers(cls) -> List[str]:
        """List all available providers."""
        providers = []
        
        if settings.OPENAI_API_KEY:
            providers.append("openai")
        if settings.ANTHROPIC_API_KEY:
            providers.append("anthropic")
        if settings.GOOGLE_API_KEY:
            providers.append("google")
        if settings.COHERE_API_KEY:
            providers.append("cohere")
        providers.append("ollama")
        if settings.HUGGINGFACE_TOKEN:
            providers.append("huggingface")
            
        return providers
    
    @classmethod
    def list_all_models(cls) -> List[Dict[str, Any]]:
        """List all models from all available providers."""
        all_models = []
        
        for provider_name in cls.list_available_providers():
            try:
                provider = cls.get_provider(provider_name)
                models = provider.list_models()
                all_models.extend(models)
            except Exception as e:
                logger.error("failed_list_models", provider=provider_name, error=str(e))
        
        return all_models
