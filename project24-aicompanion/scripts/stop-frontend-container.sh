#!/bin/bash

echo "Stopping frontend Docker container to avoid port conflicts..."

# Stop and remove the frontend container if it's running
docker-compose stop frontend-dev 2>/dev/null || true
docker-compose rm -f frontend-dev 2>/dev/null || true

echo "Frontend container stopped. Port 8081 is now available for local development."
