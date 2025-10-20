#!/bin/bash

# AI Companion Docker Startup Script

set -e

echo "Starting AI Companion with Docker..."

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "No .env file found. Detecting host IP..."
    ./scripts/get-ip.sh
fi

# Auto-detect and update IP addresses in .env for mobile development
echo "Updating network configuration..."
./scripts/get-ip.sh

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "Docker is not running. Please start Docker Desktop first."
    exit 1
fi

# Create necessary directories
echo "Creating necessary directories..."
mkdir -p docker/logs
mkdir -p ai-companion/backend/logs

# Build and start services
echo "Building and starting services..."
docker-compose up --build -d

# Wait for services to be healthy
echo "Waiting for services to start..."
sleep 10

# Check service health
echo "Checking service health..."

services=("mongodb" "embed-service" "whisper-service" "backend")
for service in "${services[@]}"; do
    echo "Checking $service..."
    if docker-compose ps | grep -q "$service.*Up"; then
        echo "$service is running"
    else
        echo "$service failed to start"
        docker-compose logs $service
    fi
done

echo ""
echo "AI Companion Backend Services Started!"
echo ""
echo "Service URLs:"
echo "   Backend API:      http://localhost:8080"
echo "   Memory Service:   http://localhost:8000"
echo "   Whisper Service:  http://localhost:8001"
echo "   MongoDB:          mongodb://localhost:27017"
echo ""
echo "To start the mobile app:"
echo "   cd frontend"
echo "   npm install"
echo "   npx expo start"
echo ""
echo "Useful commands:"
echo "   View logs:        docker-compose logs -f [service-name]"
echo "   Stop services:    docker-compose down"
echo "   Restart:          docker-compose restart [service-name]"
echo ""
