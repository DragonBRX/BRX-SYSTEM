# Open Source AI Integration Guide

This guide documents the open-source AI projects integrated or referenced within BRX System.

## Large Language Models

### Llama 3.3 70B (Meta)
- **Type**: LLM
- **Parameters**: 70B
- **Architecture**: Transformer
- **License**: Llama 3.3 License
- **Source**: https://github.com/meta-llama/llama-models
- **Capabilities**: Chat, reasoning, coding, multilingual
- **Context Window**: 128K tokens
- **Integration**: Via Ollama or llama.cpp with GGUF quantization

### DeepSeek R1 (DeepSeek AI)
- **Type**: Reasoning LLM
- **Parameters**: 70B
- **Architecture**: Transformer with CoT
- **License**: MIT
- **Source**: https://github.com/deepseek-ai/DeepSeek-R1
- **Capabilities**: Mathematical reasoning, logical inference, code generation
- **Context Window**: 64K tokens
- **Specialty**: Chain-of-thought reasoning visualization

### Mistral Small 3.1 (Mistral AI)
- **Type**: Efficient LLM
- **Parameters**: 24B
- **Architecture**: Transformer
- **License**: Apache-2.0
- **Source**: https://github.com/mistralai/mistral-inference
- **Capabilities**: Tool use, function calling, reasoning
- **Context Window**: 128K tokens
- **Efficiency**: High performance per parameter

### Qwen 2.5 VL 72B (Alibaba)
- **Type**: Vision-Language Multimodal
- **Parameters**: 72B
- **Architecture**: Transformer
- **License**: Apache-2.0
- **Source**: https://github.com/QwenLM/Qwen2.5-VL
- **Capabilities**: Image understanding, document OCR, video analysis
- **Context Window**: 32K tokens
- **Features**: Native resolution image processing

### Gemma 3 27B (Google)
- **Type**: Open-Weight Multimodal
- **Parameters**: 27B
- **Architecture**: Transformer
- **License**: Gemma Terms
- **Source**: https://github.com/google-deepmind/gemma
- **Capabilities**: Chat, vision, coding, reasoning
- **Context Window**: 128K tokens
- **Training**: Knowledge cutoff with safety tuning

### Phi-4 Multimodal (Microsoft)
- **Type**: Compact Multimodal
- **Parameters**: 5.6B
- **Architecture**: Transformer
- **License**: MIT
- **Source**: https://github.com/microsoft/Phi-4-multimodal
- **Capabilities**: Vision, speech, text in single model
- **Context Window**: 128K tokens
- **Efficiency**: Runs on consumer hardware

## Vision Models

### LLaVA OneVision (LLaVA Community)
- **Type**: Vision-Language
- **Parameters**: 72B
- **Architecture**: Transformer
- **License**: Apache-2.0
- **Source**: https://github.com/EvolvingLMMs-Lab/LLaVA-OneVision-1.5
- **Capabilities**: Image analysis, chart reading, diagram understanding
- **Training**: Fully open framework with reproducible recipes

### Stable Diffusion 3.5 (Stability AI)
- **Type**: Image Generation
- **Parameters**: 8B
- **Architecture**: MMDiT
- **License**: Stability AI Community License
- **Source**: https://github.com/Stability-AI/stablediffusion
- **Capabilities**: Text-to-image, image-to-image, inpainting
- **Features**: Exceptional prompt adherence and quality

## Audio Models

### Whisper Large v3 (OpenAI)
- **Type**: Speech Recognition
- **Parameters**: 1.5B
- **Architecture**: Transformer
- **License**: MIT
- **Source**: https://github.com/openai/whisper
- **Capabilities**: Transcription, translation (99 languages)
- **Ports**: whisper.cpp for local inference

## Embedding Models

### Nomic Embed Text v1.5 (Nomic AI)
- **Type**: Text Embedding
- **Parameters**: 137M
- **Architecture**: BERT-based
- **License**: Apache-2.0
- **Source**: https://github.com/nomic-ai/nomic
- **Capabilities**: Semantic search, clustering, RAG
- **Context Window**: 8K tokens

## Code Models

### CodeLlama 70B (Meta)
- **Type**: Code Generation
- **Parameters**: 70B
- **Architecture**: Transformer
- **License**: Llama 3 License
- **Source**: https://github.com/meta-llama/codellama
- **Capabilities**: Code generation, completion, infilling, debugging
- **Languages**: 500+ programming languages supported

## Inference Engines

### Ollama
- **Purpose**: Local model management
- **License**: MIT
- **Source**: https://github.com/ollama/ollama
- **Features**: One-line model download, REST API, multi-platform

### llama.cpp
- **Purpose**: High-performance C++ inference
- **License**: MIT
- **Source**: https://github.com/ggerganov/llama.cpp
- **Features**: GGUF format, quantization, CPU/GPU support

### vLLM
- **Purpose**: Throughput-optimized serving
- **License**: Apache-2.0
- **Source**: https://github.com/vllm-project/vllm
- **Features**: PagedAttention, continuous batching, distributed inference

## Agent Frameworks

### LangChain
- **Purpose**: Composable LLM applications
- **License**: MIT
- **Source**: https://github.com/langchain-ai/langchain
- **Features**: Chains, agents, memory, document loaders

### LangGraph
- **Purpose**: Stateful agent workflows
- **License**: MIT
- **Source**: https://github.com/langchain-ai/langgraph
- **Features**: Cyclic graphs, persistence, human-in-the-loop

### Agno
- **Purpose**: Multi-agent orchestration
- **License**: Apache-2.0
- **Source**: https://github.com/agno-agi/agno
- **Features**: Memory, knowledge, tools, multi-agent teams

## Vector Databases

### ChromaDB
- **Purpose**: AI-native vector store
- **License**: Apache-2.0
- **Source**: https://github.com/chroma-core/chroma
- **Features**: Embeddings, metadata filtering, local/remote modes

### Qdrant
- **Purpose**: High-performance vector search
- **License**: Apache-2.0
- **Source**: https://github.com/qdrant/qdrant
- **Features**: Filtering, payload, distributed deployment

## Model Context Protocol

### MCP Specification (Anthropic)
- **Purpose**: Standardized tool connection protocol
- **License**: MIT
- **Source**: https://github.com/modelcontextprotocol/specification
- **Features**: stdio, SSE, HTTP transports

### MCP Toolbox (Google)
- **Purpose**: Database MCP server
- **License**: Apache-2.0
- **Source**: https://github.com/googleapis/mcp-toolbox
- **Features**: NL2SQL, schema exploration

---

This catalog represents the open-source AI ecosystem accessible through BRX System. New models and frameworks are continuously evaluated for integration.
