---
name: local-model-runner
description: Download, configure and execute local LLMs via Ollama, llama.cpp or vLLM for offline AI inference. Use this skill when the user wants to run models locally without cloud APIs.
license: MIT
---

# Local Model Runner Skill

Run open-source LLMs, vision models, and embedding models entirely offline.

## Supported Engines
- **Ollama** (recommended for beginners)
- **llama.cpp** (maximum performance on CPU)
- **vLLM** (high-throughput GPU serving)

## Quick Start with Ollama
```bash
# Install
curl -fsSL https://ollama.com/install.sh | sh

# Pull a model
ollama pull llama3.2

# Run interactive
ollama run llama3.2
```

## Model Size Guide
| Hardware | Recommended Models | Parameters |
|----------|-------------------|------------|
| 8GB RAM | phi, tinyllama, gemma:2b | 1B-3B |
| 16GB RAM | llama3.2, mistral, qwen2.5 | 7B-8B |
| 32GB RAM | llama3.1:70b-q4 | 70B quantized |
| GPU (8GB VRAM) | llama3.1, mistral-large | 8B-13B |
| GPU (24GB VRAM) | mixtral, qwen72b-q4 | 47B-72B |

## Integration with BRX SYSTEM
Set environment variables:
```bash
OLLAMA_URL=http://localhost:11434
BRX_MODE=local
BRX_LOCAL_MODEL=llama3.2
```

## Quantization Explained
- **Q4_0** — Fastest, smallest, slight quality loss
- **Q5_K_M** — Balanced speed/quality
- **Q8_0** — Near original quality, larger size
- **FP16** — Full precision, requires most resources

## Tips
- Use `ollama list` to see installed models
- Use `ollama rm <model>` to free disk space
- Enable GPU offload in Ollama for faster inference
