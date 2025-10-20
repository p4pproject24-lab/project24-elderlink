#!/bin/bash

# Get Host IP Address Script
# This script detects the host machine's IP address for Docker/development

echo "Detecting host IP address..."

# Function to get the primary network interface IP
get_primary_ip() {
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        ip=$(ifconfig | grep "inet " | grep -Fv 127.0.0.1 | awk '{print $2}' | head -1)
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        ip=$(hostname -I | awk '{print $1}')
    else
        # Windows/Other
        ip=$(ipconfig | grep "IPv4" | head -1 | awk '{print $14}')
    fi
    echo $ip
}

# Get the IP
HOST_IP=$(get_primary_ip)

if [ -z "$HOST_IP" ]; then
    echo "Could not detect IP address automatically"
    echo "Please manually set your IP in .env file:"
    echo "EXPO_PUBLIC_API_URL=http://YOUR_IP:8080"
    echo "EXPO_PUBLIC_WHISPER_API_URL=http://YOUR_IP:8001"
    echo "EXPO_PUBLIC_MEMORY_API_URL=http://YOUR_IP:8000"
    exit 1
fi

echo "Detected Host IP: $HOST_IP"

# Update .env file if it exists
if [ -f ".env" ]; then
    echo "Updating .env file with detected IP..."
    
    # Update or add the environment variables
    if grep -q "EXPO_PUBLIC_API_URL=" .env; then
        sed -i.bak "s|EXPO_PUBLIC_API_URL=.*|EXPO_PUBLIC_API_URL=http://${HOST_IP}:8080|" .env
    else
        echo "EXPO_PUBLIC_API_URL=http://${HOST_IP}:8080" >> .env
    fi
    
    if grep -q "EXPO_PUBLIC_WHISPER_API_URL=" .env; then
        sed -i.bak "s|EXPO_PUBLIC_WHISPER_API_URL=.*|EXPO_PUBLIC_WHISPER_API_URL=http://${HOST_IP}:8001|" .env
    else
        echo "EXPO_PUBLIC_WHISPER_API_URL=http://${HOST_IP}:8001" >> .env
    fi
    
    if grep -q "EXPO_PUBLIC_MEMORY_API_URL=" .env; then
        sed -i.bak "s|EXPO_PUBLIC_MEMORY_API_URL=.*|EXPO_PUBLIC_MEMORY_API_URL=http://${HOST_IP}:8000|" .env
    else
        echo "EXPO_PUBLIC_MEMORY_API_URL=http://${HOST_IP}:8000" >> .env
    fi
    
    # Clean up backup file
    rm -f .env.bak
    
    echo "Updated .env file with IP: $HOST_IP"
else
    echo "No .env file found. Creating one..."
    echo "EXPO_PUBLIC_API_URL=http://${HOST_IP}:8080" > .env
    echo "EXPO_PUBLIC_WHISPER_API_URL=http://${HOST_IP}:8001" >> .env
    echo "EXPO_PUBLIC_MEMORY_API_URL=http://${HOST_IP}:8000" >> .env
    echo "Created .env file with IP: $HOST_IP"
fi

echo ""
echo "Network Configuration:"
echo "  Backend API:      http://${HOST_IP}:8080"
echo "  Whisper Service:  http://${HOST_IP}:8001"
echo "  Memory Service:   http://${HOST_IP}:8000"
echo ""
echo "You can now start your services!"
