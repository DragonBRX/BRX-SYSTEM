# Compatibility & Deployment Guide

> **BRX • Brasil x Futuro** — *Agora é a vez dos brasileiros brincar.*

This document lists all verified environments and deployment targets for BRX SYSTEM.

## Verified Environments

### Local Development
| OS | Node | Status |
|----|------|--------|
| Ubuntu 22.04/24.04 | 20+ | ✅ Full |
| macOS 14+ | 20+ | ✅ Full |
| Windows 11 (WSL2) | 20+ | ✅ Full |
| Windows 11 (Native) | 20+ | ✅ Partial* |

> *Native Windows requires Git Bash or PowerShell 7+ for some scripts.

### Cloud & Server
| Platform | Method | Status |
|----------|--------|--------|
| Docker | `docker-compose up` | ✅ Full |
| Kubernetes | Helm chart (community) | 🔄 WIP |
| AWS EC2 | Ubuntu + Docker | ✅ Full |
| Google Cloud Run | Containerized build | 🔄 WIP |
| Azure App Service | Container | 🔄 WIP |
| Railway / Render | Dockerfile | ✅ Full |
| Vercel | Frontend only | ⚠️ Partial |

### Notebooks & Free Tiers
| Platform | Notebook | Status | Notes |
|----------|----------|--------|-------|
| Google Colab (Free) | `BRX_System_Normal.ipynb` | ✅ Full | API mode recommended |
| Google Colab (Free) | `BRX_System_MultiAgent.ipynb` | ✅ Full | Up to 5 agents |
| Google Colab (Free) | `BRX_System_Local.ipynb` | ✅ Full | Models ≤4GB |
| Google Colab Pro | All notebooks | ✅ Full | GPU models supported |
| Kaggle | Manual setup | 🔄 WIP | Similar to Colab |
| JupyterHub | Self-hosted | ✅ Full | Docker-based |

## Database Backends
| Database | Status | Use Case |
|----------|--------|----------|
| MySQL 8.0 | ✅ Full | Production default |
| SQLite | ✅ Full | Colab / development |
| PostgreSQL | 🔄 WIP | Community request |
| MariaDB | ✅ Full | MySQL compatible |

## AI Provider Matrix
| Provider | Local | Cloud | Colab Free | Colab Pro |
|----------|-------|-------|------------|-----------|
| Ollama | ✅ | — | ✅ CPU | ✅ GPU |
| OpenAI | — | ✅ | ✅ API | ✅ API |
| Anthropic | — | ✅ | ✅ API | ✅ API |
| Google Gemini | — | ✅ | ✅ API (generous) | ✅ API |
| DeepSeek | — | ✅ | ✅ API | ✅ API |
| HuggingFace | ✅ | ✅ | ✅ | ✅ |
| llama.cpp | ✅ | — | ✅ CPU | ✅ GPU |
| vLLM | ✅ | — | ❌ | ✅ GPU |

## Browser Support
| Browser | Version | Status |
|---------|---------|--------|
| Chrome | 120+ | ✅ Full |
| Firefox | 121+ | ✅ Full |
| Safari | 17+ | ✅ Full |
| Edge | 120+ | ✅ Full |
| Mobile Chrome | 120+ | ✅ Full |
| Mobile Safari | 17+ | ⚠️ Partial* |

> *Some advanced animations may be simplified on mobile Safari.

## Contributing New Targets
To add a new verified environment:
1. Test BRX SYSTEM on the target platform
2. Document any special setup steps
3. Open a PR adding a row to the relevant table above
4. Include a `Dockerfile` or script if applicable
