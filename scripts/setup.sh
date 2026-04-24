#!/bin/bash
set -e

echo "BRX SYSTEM - Setup Script"
echo "========================"

# Check dependencies
command -v python3 >/dev/null 2>&1 || { echo "Python 3 is required but not installed."; exit 1; }
command -v node >/dev/null 2>&1 || { echo "Node.js is required but not installed."; exit 1; }
command -v docker >/dev/null 2>&1 || { echo "Docker is recommended but not required."; }

# Create directories
mkdir -p data/{uploads,models,raw,processed}
mkdir -p logs

# Setup Python environment
echo "Setting up Python environment..."
cd apps/api
python3 -m venv venv 2>/dev/null || true
source venv/bin/activate
pip install -r requirements.txt
cd ../..

# Setup Node.js
echo "Setting up Node.js dependencies..."
cd apps/web
npm install
cd ../..

# Copy environment file
if [ ! -f .env ]; then
    cp configs/.env.example .env
    echo "Created .env file. Please configure it."
fi

echo "Setup complete!"
echo ""
echo "Next steps:"
echo "1. Configure .env file with your API keys"
echo "2. Run: docker-compose -f infrastructure/docker/docker-compose.yml up -d"
echo "3. Or start locally:"
echo "   - API: cd apps/api && uvicorn src.main:app --reload"
echo "   - Web: cd apps/web && npm run dev"
