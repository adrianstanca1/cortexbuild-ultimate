#!/bin/bash
set -e

echo "=== Deployment Script ==="

if [ ! -f ".env" ]; then
    echo "Warning: .env file not found. Copy .env.example to .env and configure."
fi

echo "Pulling latest changes..."
git pull origin main

echo "Building and starting containers..."
docker-compose down
docker-compose build --no-cache
docker-compose up -d

echo "Running database migrations..."
docker-compose exec -T app npm run db:migrate

echo "Running health check..."
./scripts/health-check.sh

echo "=== Deployment Complete ==="
