#!/bin/bash

# AI Companion Docker Stop Script

set -e

echo "Stopping AI Companion services..."

# Stop and remove containers
docker-compose down

echo "Cleaning up..."

# Optional: Remove volumes (uncomment if you want to reset data)
# echo "Removing volumes (this will delete all data)..."
# docker-compose down -v

# Optional: Remove images (uncomment if you want to clean everything)
# echo "Removing images..."
# docker-compose down --rmi all

echo "All services stopped successfully!"
echo ""
echo "To start again, run: ./scripts/start-docker.sh"
echo "To completely reset (delete data): docker-compose down -v"
echo "To rebuild images: docker-compose up --build"
