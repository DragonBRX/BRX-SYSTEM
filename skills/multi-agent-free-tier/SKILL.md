---
name: multi-agent-free-tier
description: Optimize BRX multi-agent orchestration for free-tier environments (Google Colab, low-RAM VPS, shared hosting). Use this skill when the user needs to run multiple agents with limited compute or budget.
license: MIT
---

# Multi-Agent Free-Tier Optimization

Run BRX SYSTEM's multi-agent architecture on constrained resources.

## Architecture Overview
BRX SYSTEM is inherently multi-agent. Each agent:
- Has its own system prompt
- Can access tools and memory
- Communicates via shared bus or direct messaging

## Free-Tier Optimizations

### 1. Agent Pool Limiting
```bash
BRX_MAX_AGENTS=3          # instead of unlimited
BRX_AGENT_CONCURRENCY=1   # sequential execution
```

### 2. Shared Memory
```bash
BRX_SHARED_MEMORY=true    # all agents read same context
BRX_MEMORY_BACKEND=sqlite # lightweight storage
```

### 3. Model Routing per Agent
Assign cheaper/faster models to simpler agents:
- **Planner Agent**: Gemini Flash / GPT-4o-mini
- **Coder Agent**: CodeLlama / DeepSeek-Coder
- **Reviewer Agent**: Same as planner (or local phi)

### 4. Tool Caching
```bash
BRX_CACHE_TOOL_RESULTS=true
BRX_CACHE_TTL=3600
```

### 5. Workflow Chunking
Break large workflows into smaller sub-workflows that execute sequentially rather than in parallel.

## Google Colab Specific
- Use `BRX_LIGHT_MODE=true` to disable heavy UI animations
- Use SQLite instead of MySQL for zero-setup persistence
- Use ngrok only when sharing; local proxy is sufficient for personal use

## API Cost Control
- Implement rate limiting: `BRX_RATE_LIMIT=10/min`
- Use response caching for repeated queries
- Fallback to local models when API quota exceeded

## Monitoring
Track agent execution with:
```bash
npm run skills:audit
```
