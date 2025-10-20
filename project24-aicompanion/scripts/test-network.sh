#!/bin/bash

# Test Network Configuration Script
# This script tests if the network utilities can detect the correct IP

echo "Testing network configuration..."

# Get the current IP from get-ip.sh
echo "1. Detecting host IP..."
./scripts/get-ip.sh

echo ""
echo "2. Current .env configuration:"
if [ -f ".env" ]; then
    grep "EXPO_PUBLIC_.*_URL" .env || echo "No EXPO_PUBLIC URLs found in .env"
else
    echo "No .env file found"
fi

echo ""
echo "3. Testing connectivity to backend services:"

# Check if services are running
echo "  - Testing backend (port 8080)..."
if curl -s -f http://localhost:8080/actuator/health > /dev/null 2>&1; then
    echo "    ✓ Backend is running on localhost:8080"
else
    echo "    ✗ Backend not accessible on localhost:8080"
fi

echo "  - Testing Whisper service (port 8001)..."
if curl -s -f http://localhost:8001/health > /dev/null 2>&1; then
    echo "    ✓ Whisper service is running on localhost:8001"
else
    echo "    ✗ Whisper service not accessible on localhost:8001"
fi

echo "  - Testing Memory service (port 8000)..."
if curl -s -f http://localhost:8000/docs > /dev/null 2>&1; then
    echo "    ✓ Memory service is running on localhost:8000"
else
    echo "    ✗ Memory service not accessible on localhost:8000"
fi

echo ""
echo "4. Network configuration complete!"
echo "   Your mobile app should now automatically connect to the correct IP address."
