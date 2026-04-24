# Getting Started with BRX SYSTEM

## Prerequisites

- Python 3.11 or higher
- Node.js 20 or higher
- Docker (optional)
- 8GB+ RAM recommended

## Installation

### 1. Clone Repository

```bash
git clone https://github.com/DragonBRX/BRX-SYSTEM.git
cd BRX-SYSTEM
```

### 2. Environment Setup

```bash
# Run automated setup
bash scripts/setup.sh

# Or manually:
# Python API
cd apps/api
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Web dashboard
cd apps/web
npm install
```

### 3. Configuration

```bash
cp configs/.env.example .env
# Edit .env with your settings
```

### 4. Start Services

#### With Docker (Recommended)

```bash
docker-compose -f infrastructure/docker/docker-compose.yml up -d
```

#### Manual Start

```bash
# Terminal 1 - API
cd apps/api
source venv/bin/activate
uvicorn src.main:app --reload --host 0.0.0.0 --port 8000

# Terminal 2 - Web
cd apps/web
npm run dev

# Terminal 3 - Worker (optional)
cd apps/api
source venv/bin/activate
celery -A src.worker worker -l info
```

### 5. Access Dashboard

Open http://localhost:5173 in your browser.

## First Steps

### Create Your First Agent

```bash
curl -X POST http://localhost:8000/api/v1/agents/create   -H "Content-Type: application/json"   -d '{
    "name": "my_first_agent",
    "role": "general",
    "instructions": "You are a helpful assistant.",
    "model": "llama3.2"
  }'
```

### Execute the Agent

```bash
curl -X POST http://localhost:8000/api/v1/agents/execute/my_first_agent   -H "Content-Type: application/json"   -d '{"query": "What is the capital of France?"}'
```

### Ingest a Document

```bash
curl -X POST http://localhost:8000/api/v1/rag/ingest   -H "Content-Type: application/json"   -d '{
    "source": "example.txt",
    "content": "Paris is the capital of France.",
    "doc_type": "text"
  }'
```

## Next Steps

- Explore the [API documentation](http://localhost:8000/docs)
- Read the [Architecture Guide](architecture/overview.md)
- Configure [additional LLM providers](guides/providers.md)
- Set up [production deployment](guides/production.md)
