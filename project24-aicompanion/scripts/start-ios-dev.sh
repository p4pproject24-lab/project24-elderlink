#!/bin/bash

echo "Starting AI Companion iOS Development Environment"
echo "=================================================="

# Get the project root directory
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

echo "Project root: $PROJECT_ROOT"

# Step 1: Stop any running frontend container and start backend services
echo ""
echo "Stopping any running frontend container to avoid port conflicts..."
./scripts/stop-frontend-container.sh

echo ""
echo "Starting Docker backend services..."
echo "Note: Starting backend services only, frontend will run locally for iOS development"

# Start only the backend services, not the frontend
docker-compose up -d mongodb embed-service whisper-service backend

echo "Waiting for backend services to be ready..."
sleep 10

# Step 2: Check if frontend dependencies are installed
echo ""
echo "Setting up frontend dependencies..."
cd frontend

if [ ! -d "node_modules" ]; then
    echo "Installing npm dependencies..."
    npm install --legacy-peer-deps
else
    echo "Dependencies already installed."
fi

# Step 3: Start Expo development server in background  
echo ""
echo "Starting Expo development server on port 8082..."
npx expo start --port 8082 --host lan &
EXPO_PID=$!

# Wait a moment for Expo to start
sleep 5

# Step 4: Run iOS app
echo ""
echo "Building and launching iOS simulator..."
echo "This may take a few minutes on first run..."

# Run iOS simulator (this will automatically connect to the Expo server on 8082)
npx expo run:ios

# Automatically stop the Expo server when iOS simulator closes
echo ""
echo "iOS development session ended."
echo "Stopping Expo server..."
kill $EXPO_PID 2>/dev/null
echo "Expo server stopped."
