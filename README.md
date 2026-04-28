<div align="center">

# 🇧🇷 BRX SYSTEM — Agora é a vez dos brasileiros brincar

**BRX • Brasil x Futuro**

A plataforma open-source definitiva para orquestração de IA multi-agentes, modelos locais, pipelines RAG e automação inteligente — com compatibilidade total para Google Colab, ambientes locais e nuvem.

[![Open Source](https://img.shields.io/badge/Open%20Source-100%25-green)](LICENSE)
[![Skills](https://img.shields.io/badge/Skills-1500%2B-blue)](CATALOG.md)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-7-646CFF?logo=vite)](https://vitejs.dev)

</div>

---

## 🚀 O que é o BRX SYSTEM?

O **BRX SYSTEM** é uma plataforma completa, **código aberto** e **gratuita** para qualquer pessoa usar. Ela une o melhor da inteligência artificial open-source em um único ecossistema unificado, permitindo que desenvolvedores, pesquisadores e entusiastas brasileiros criem soluções poderosas com IA sem depender exclusivamente de serviços pagos internacionais.

> **Propósito:** Democratizar o acesso à IA avançada no Brasil, com suporte nativo para execução local, via API e diretamente no **Google Colab gratuito**.

---

## 📊 Números do Projeto

| Métrica | Valor |
|---------|-------|
| **Skills** | 1.500+ playbooks para agentes de IA |
| **Modelos Suportados** | LLaMA, DeepSeek, Mistral, Qwen, Gemma, Phi, LLaVA, Stable Diffusion, Whisper, CodeLlama e mais |
| **Provedores de IA** | Ollama (local), OpenAI, Anthropic, Google, DeepSeek, HuggingFace |
| **Componentes UI** | 50+ componentes shadcn/ui prontos |
| **Páginas** | 17 módulos integrados |
| **Idiomas Oficiais** | Português (BR) 🇧🇷, Inglês 🇺🇸 |
| **Licença** | MIT — 100% livre |

---

## 🧩 Funcionalidades Principais

### 1. 🧠 Explorador de Modelos
Descubra e gerencie modelos open-source com metadados completos: arquitetura, quantização, tamanho de contexto, licença e URLs de download.

### 2. 💬 Chat Universal
Chat multi-modelo com histórico de conversas, prompts de sistema personalizáveis, controle de temperatura e tokens. Funciona com modelos locais (Ollama, llama.cpp, vLLM) e provedores remotos.

### 3. 🤖 Construtor de Agentes
Crie agentes de IA autônomos com:
- Prompts de sistema personalizados
- Integração de ferramentas (tools)
- Memória com janela configurável
- Anexos de base de conhecimento
- Compartilhamento público/privado

### 4. 📚 Base de Conhecimento / RAG
Monte sistemas de Geração Aumentada por Recuperação (RAG):
- Integrações: ChromaDB, Qdrant, Weaviate, Milvus, pgvector
- Estratégias de chunking configuráveis
- Ingestão e indexação de documentos
- Busca semântica

### 5. ⚙️ Motor de Workflows
Pipelines de automação visual com nodes:
- Triggers: manual, agendado, webhook, evento
- Nodes de LLM, Agentes e Processamento de Dados
- Histórico de execução e monitoramento

### 6. 🔌 Integrações & MCP
Conecte serviços externos:
- **Ollama** — inferência local
- **OpenAI, Anthropic, Google** — APIs em nuvem
- **HuggingFace** — hub de modelos
- **MCP (Model Context Protocol)** — servidores de contexto
- **Endpoints OpenAI-compatíveis** personalizados

### 7. 🚀 Google Colab Support
Rode o BRX SYSTEM diretamente no Google Colab:
- **Opção Normal:** chat e agentes via API (OpenAI, DeepSeek, etc.)
- **Opção Multi-Agentes:** orquestração completa com modelos leves ou APIs gratuitas
- **Opção Local:** baixe e execute modelos locais (CPU) dentro do Colab

---

## 🏗️ Arquitetura

```
┌─────────────────────────────────────────┐
│           Frontend (React 19)           │
│  Vite • TypeScript • Tailwind • shadcn  │
├─────────────────────────────────────────┤
│         Backend (Hono + tRPC)           │
│   Type-safe • Drizzle ORM • MySQL       │
├─────────────────────────────────────────┤
│        AI Providers & Local LLMs        │
│  Ollama • llama.cpp • vLLM • APIs      │
├─────────────────────────────────────────┤
│      RAG • Agents • Workflows • MCP     │
└─────────────────────────────────────────┘
```

---

## 🛠️ Tecnologias

| Camada | Tecnologia |
|--------|-----------|
| Frontend | React 19, Vite 7, Tailwind CSS v4, shadcn/ui |
| Backend | Hono HTTP, tRPC 11, Node.js 20+ |
| Banco de Dados | MySQL, Drizzle ORM |
| AI / LLM | Ollama, OpenAI SDK, Anthropic SDK, Google GenAI |
| RAG | ChromaDB, Qdrant, Weaviate, Milvus |
| Autenticação | OAuth 2.0 |

---

## 📦 Instalação

### Requisitos
- Node.js 20+
- MySQL
- npm ou pnpm

### Passo a passo
```bash
git clone https://github.com/DragonBRX/BRX-SYSTEM.git
cd BRX-SYSTEM
npm install
```

### Configuração
Crie o arquivo `.env` com suas credenciais:
```bash
DATABASE_URL="mysql://user:pass@localhost:3306/brx_system"
VITE_KIMI_AUTH_URL="https://seu-oauth.com"
VITE_APP_ID="seu-app-id"
```

### Banco de Dados
```bash
npm run db:push
```

### Executar
```bash
npm run dev      # Modo desenvolvimento com HMR
npm run build    # Build para produção
npm start        # Iniciar servidor de produção
```

---

## 🚀 Google Colab — Comece em 1 minuto

Acesse os notebooks oficiais e rode o BRX SYSTEM sem instalar nada:

| Notebook | Descrição | Link |
|----------|-----------|------|
| `BRX_System_Normal.ipynb` | Versão padrão — chat + agentes via API | [Abrir no Colab](https://colab.research.google.com/github/DragonBRX/BRX-SYSTEM/blob/main/colab/BRX_System_Normal.ipynb) |
| `BRX_System_MultiAgent.ipynb` | Versão multi-agentes — orquestração completa | [Abrir no Colab](https://colab.research.google.com/github/DragonBRX/BRX-SYSTEM/blob/main/colab/BRX_System_MultiAgent.ipynb) |
| `BRX_System_Local.ipynb` | Modelos locais via Ollama/llama.cpp no Colab CPU | [Abrir no Colab](https://colab.research.google.com/github/DragonBRX/BRX-SYSTEM/blob/main/colab/BRX_System_Local.ipynb) |

> 💡 **Dica:** A versão gratuita do Colab é compatível! Use modelos via API ou modelos locais leves (até 4GB).

---

## 📚 Documentação

- [`docs/GETTING_STARTED.md`](docs/GETTING_STARTED.md) — Primeiros passos
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — Arquitetura detalhada
- [`docs/API_REFERENCE.md`](docs/API_REFERENCE.md) — Referência da API
- [`docs/SECURITY.md`](docs/SECURITY.md) — Boas práticas de segurança
- [`docs/skills/`](docs/skills/) — Guia de skills e contribuição
- [`CATALOG.md`](CATALOG.md) — Catálogo completo de 1.500+ skills

---

## 🧩 Comandos Disponíveis

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Servidor de desenvolvimento com HMR |
| `npm run build` | Build para produção |
| `npm run check` | Type-check de todos os arquivos |
| `npm run db:push` | Sincronizar schema com o banco |
| `npm run db:generate` | Gerar migração SQL |
| `npm run db:migrate` | Aplicar migrações pendentes |
| `npm run format` | Formatar código com Prettier |
| `npm run test` | Executar testes com Vitest |
| `npm run skills:validate` | Validar todas as skills |
| `npm run skills:build` | Indexar e catalogar skills |
| `npm run skills:test` | Rodar suite de testes de skills |

---

## 🌐 Compatibilidade & Ambientes Suportados

| Ambiente | Status | Detalhes |
|----------|--------|----------|
| **Localhost / Desktop** | ✅ Total | Node.js 20+, MySQL local |
| **Docker** | ✅ Total | `docker-compose up` incluído |
| **Google Colab (Gratuito)** | ✅ Total | Notebooks oficiais disponíveis |
| **Google Colab Pro/Pro+** | ✅ Total | Acesso a GPU para modelos maiores |
| **Servidor VPS/Cloud** | ✅ Total | Build + deploy com Docker |
| **Hugging Face Spaces** | 🔄 Em breve | Versão simplificada containerizada |

---

## 🤝 Como Contribuir

1. Fork o repositório
2. Crie uma branch: `git checkout -b feat/minha-feature`
3. Commit: `git commit -m "feat: adiciona nova skill para X"`
4. Push: `git push origin feat/minha-feature`
5. Abra um Pull Request

Leia [`CONTRIBUTING.md`](CONTRIBUTING.md) e [`docs/skills/CONTRIBUTING_SKILLS.md`](docs/skills/CONTRIBUTING_SKILLS.md) para detalhes.

---

## 🛡️ Licença

**MIT License** — 100% código aberto. Use, modifique, distribua e comercialize livremente.

> *Este projeto é mantido pela comunidade brasileira e internacional. Junte-se a nós para construir o futuro da IA open-source.*

---

<div align="center">

**🇧🇷 BRX — Brasil x Futuro 🇧🇷**

*Agora é a vez dos brasileiros brincar.*

</div>
