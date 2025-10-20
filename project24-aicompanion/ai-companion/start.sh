#!/bin/bash
set -e

echo "Starting backend..."

# Load environment variables from .env file if it exists
if [ -f "backend/.env" ]; then
    echo "Loading environment variables from backend/.env"
    export $(cat backend/.env | grep -v '^#' | xargs)
fi

cd backend
export JAVA_HOME=$(/usr/libexec/java_home -v 21)
echo "Using Java: $JAVA_HOME"

# Build and run Spring Boot backend (skip tests for faster startup)
mvn clean install -DskipTests
mvn spring-boot:run &
BACKEND_PID=$!

cd ../embed-service

echo "Setting up embed-service virtual environment..."

# Create virtual environment if it doesn't exist
if [ ! -d "embed_venv" ]; then
    echo "Creating embed-service virtual environment..."
    python3 -m venv embed_venv
fi

# Activate virtual environment and install requirements
source embed_venv/bin/activate
pip install -r requirements.txt

echo "Starting embed-service with Uvicorn..."
uvicorn memory_api:app --reload --host 0.0.0.0 --port 8000 &
EMBED_PID=$!

cd ../whisper-service

echo "Setting up whisper-service virtual environment..."

# Create virtual environment if it doesn't exist
if [ ! -d "whisper_venv" ]; then
    echo "Creating whisper-service virtual environment..."
    python3 -m venv whisper_venv
fi

# Activate virtual environment and install requirements
source whisper_venv/bin/activate
pip install -r requirements.txt

echo "Starting whisper-service with Uvicorn..."
uvicorn whisper_api:app --reload --host 0.0.0.0 --port 8001 &
WHISPER_PID=$!

# Function to cleanup processes
cleanup() {
    echo "Stopping services..."
    
    # Kill specific process IDs if they exist
    if [ ! -z "$BACKEND_PID" ]; then
        echo "Stopping backend process $BACKEND_PID..."
        kill $BACKEND_PID 2>/dev/null || true
    fi
    if [ ! -z "$EMBED_PID" ]; then
        echo "Stopping embed service process $EMBED_PID..."
        kill $EMBED_PID 2>/dev/null || true
    fi
    if [ ! -z "$WHISPER_PID" ]; then
        echo "Stopping whisper service process $WHISPER_PID..."
        kill $WHISPER_PID 2>/dev/null || true
    fi
    
    # Kill any processes using the specific ports
    echo "Killing processes on ports 8080, 8000, and 8001..."
    
    # Kill process on port 8080 (Backend)
    PORT_8080_PID=$(lsof -ti:8080 2>/dev/null)
    if [ ! -z "$PORT_8080_PID" ]; then
        echo "Killing process on port 8080: $PORT_8080_PID"
        kill -9 $PORT_8080_PID 2>/dev/null || true
    fi
    
    # Kill process on port 8000 (Embed Service)
    PORT_8000_PID=$(lsof -ti:8000 2>/dev/null)
    if [ ! -z "$PORT_8000_PID" ]; then
        echo "Killing process on port 8000: $PORT_8000_PID"
        kill -9 $PORT_8000_PID 2>/dev/null || true
    fi
    
    # Kill process on port 8001 (Whisper Service)
    PORT_8001_PID=$(lsof -ti:8001 2>/dev/null)
    if [ ! -z "$PORT_8001_PID" ]; then
        echo "Killing process on port 8001: $PORT_8001_PID"
        kill -9 $PORT_8001_PID 2>/dev/null || true
    fi
    
    # Kill any uvicorn processes that might be orphaned
    echo "Cleaning up any remaining uvicorn and java processes..."
    pkill -f "uvicorn.*memory_api" 2>/dev/null || true
    pkill -f "uvicorn.*whisper_api" 2>/dev/null || true
    pkill -f "spring-boot:run" 2>/dev/null || true
    pkill -f "ai-companion.*jar" 2>/dev/null || true
    
    echo "All services stopped successfully!"
    exit 0
}

# Trap multiple signals to ensure cleanup
trap cleanup SIGINT SIGTERM SIGHUP EXIT

# Wait for both to finish (will exit on Ctrl+C or script termination)
wait