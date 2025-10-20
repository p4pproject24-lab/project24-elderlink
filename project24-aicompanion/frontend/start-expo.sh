#!/bin/sh

echo "Setting up Expo development environment..."

# Install dependencies first
echo "Installing dependencies..."
npm install --legacy-peer-deps

# iOS development requires running on the host macOS (not in Docker)
# This script prepares the environment and starts the development server
echo "Starting Expo development server for iOS development..."
echo ""
echo "📱 To run on iOS simulator, open a new terminal and run:"
echo "   cd frontend"
echo "   npx expo run:ios"
echo ""
echo "🔧 Backend services are running in Docker and accessible at:"
echo "   - Backend API: http://localhost:8080"
echo "   - Whisper Service: http://localhost:8001" 
echo "   - Memory Service: http://localhost:8000"
echo ""

# Start the Expo development server
npx expo start --host lan --port 19000
