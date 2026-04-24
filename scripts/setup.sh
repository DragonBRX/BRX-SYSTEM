#!/bin/bash
set -e

echo "BRX System Setup Script"
echo "======================="

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
    echo "Error: Node.js 20+ required. Current: $(node -v)"
    exit 1
fi

echo "Node.js version: $(node -v)"

# Install dependencies
echo "Installing dependencies..."
npm ci

# Setup database
echo "Setting up database..."
if [ -z "$DATABASE_URL" ]; then
    echo "Warning: DATABASE_URL not set. Please configure .env file."
fi

npm run db:push

# Seed default models
echo "Seeding default AI models..."
curl -X POST http://localhost:3000/api/trpc/ai.seedModels 2>/dev/null || echo "Skipping seed - server not running"

echo "Setup complete! Run 'npm run dev' to start development."
