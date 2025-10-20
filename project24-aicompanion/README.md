<br />
<div align="center">
 <h2 align="center">ElderLink</h2>
</h3>

 <p align="center">
 <strong>UoA Part 4 Project: Project 24 - AI-Enabled Virtual Assistant for Aged Care </strong>
 <br />
</p>
</div>
<br />

<br />


**IMPORTANT:** `.env` files are currently committed to this **private repository** for easier project setup. **These will be removed before making the repo public.**



## Getting Started


### Prerequisites

- **macOS Only**
   - This project requires **macOS** with **Xcode** for iOS Simulator development.

- **Node.js 18+**
   - Required for React Native frontend dependencies and Expo tooling
   - [Download Node.js](https://nodejs.org/)

- **Xcode** (macOS only)
   - Required for iOS Simulator and native iOS development
   - [Download from Mac App Store](https://apps.apple.com/us/app/xcode/id497799835)

- **Docker Desktop** (Recommended)
  - Required for backend services (MongoDB, API, AI services)
  - [Download Docker Desktop](https://www.docker.com/products/docker-desktop/)

- **Java 21** (for local development)
  - Required for Spring Boot backend
  - [Download OpenJDK 21](https://openjdk.org/projects/jdk/21/)

- **Python 3.8+** (for local development)
  - Required for AI services (embed-service, whisper-service)
  - [Download Python](https://www.python.org/downloads/)

- **MongoDB** (for local development)
  - Required for database
  - [Download MongoDB Community](https://www.mongodb.com/try/download/community)

 <br />


### **Quick Start with iOS Development Script**

**Automated Setup:** Use the iOS development script to start everything at once:

```bash
# Clone the repo using Terminal/Command Prompt
git clone https://github.com/andy7937/project24-aicompanion.git

# Make sure Docker Desktop is running
open -a Docker

# Setup iOS Simulator (first time only)
# Open Xcode → Window → Devices and Simulators → Configure a simulator device. 

# Run the complete iOS development environment
./scripts/start-ios-dev.sh

# To stop services when done:
# Press Ctrl+C in the terminal (stops iOS app and Expo server)
# Then run:
./scripts/stop-docker.sh # (stops Docker backend services)
```

**Need help with iOS Simulator setup?** See [Apple's official guide](https://developer.apple.com/documentation/xcode/running-your-app-in-simulator-or-on-a-device)

This script will:
- Start Docker backend services (MongoDB, API, AI services)
- Install frontend dependencies automatically
- Launch Expo development server
- Build and open iOS Simulator
- Clean up when finished

### **Local Development Setup** (Alternative to Docker)

If you prefer to run services locally without Docker:

**Backend Setup:**
```bash
# 1. Start MongoDB locally

# 2. Navigate to backend directory
cd ai-companion

# 3. Run the start script (starts all backend services)
./start.sh
```

**Frontend Setup:**
```bash
# 1. Navigate to frontend directory
cd frontend

# 2. Install iOS dependencies
cd ios
pod install
cd ..

# 3. Start the iOS app
npx expo run:ios
```

**What the start.sh script does:**
- Starts Spring Boot backend (port 8080)
- Starts embed-service with ChromaDB (port 8000)
- Starts whisper-service (port 8001)
- Handles cleanup on exit (Ctrl+C)

**Prerequisites for Local Development:**
- Java 21 (for Spring Boot)
- Python 3.8+ (for AI services)
- MongoDB running locally
- Node.js 18+ (for frontend)
- Xcode (for iOS development)

## **Important Notes**

### **iOS Simulator Limitations:**
**Only the Elderly User role** can be fully tested on macOS iOS Simulator.

- **Camera functionality not available** - iOS Simulator cannot access physical camera
- **Caregiver role limited** - Cannot scan QR codes to sync with elderly users

### **HeyGen Avatar Streaming Quota:**
**Be mindful of usage** - The free HeyGen plan includes **only 50 minutes** of avatar streaming per month.

**Backup API Key:** If the current quota runs out, use this fresh key:
```
AVATAR_STREAMING_API_KEY=NzJkMGE2NDc1YzNiNGVjYjgyODQzZjM5MzVjYzc5ZjktMTc1NzgwMjM3OA==
```
Add this to your **root level `.env`** file to replace the existing key.

## Running Tests

### Frontend
The frontend uses [Jest](https://jestjs.io/) with [React Testing Library](https://testing-library.com/) for unit and integration tests.

To run all frontend tests:

1. **Navigate to the frontend package**:
   ```sh
   cd frontend
   ```

2. **Running All Tests**:
   ```sh
   npm test
   ```
   > This will launch the Jest test runner in watch mode. All unit and integration tests will be executed, including components, hooks, services, contexts, etc.

3. **Running Tests Once (No Watch Mode)**:
   ```sh
   npm test -- --watchAll=false
   ```

4. **To Check Coverage**:
   ```sh
   npm test -- --coverage
   ```
   > This will generate coverage reports in the `coverage/` directory with HTML, LCOV, and text formats.

### Backend
The backend uses [JUnit 5](https://junit.org/junit5/) with [Mockito](https://site.mockito.org/) and [JaCoCo](https://www.jacoco.org/jacoco/) for comprehensive unit testing and coverage reporting.

To run all backend tests:

1. **Navigate to the backend package**:
   ```sh
   cd ai-companion/backend
   ```

2. **Running All Tests**:
   ```sh
   mvn test
   ```
   > This will run all unit tests for controllers and services with comprehensive coverage.

3. **Running Tests with Coverage Report**:
   ```sh
   mvn clean test jacoco:report
   ```
   > This generates a detailed JaCoCo coverage report showing instruction and branch coverage.

4. **To View Coverage Report**:
   ```sh
   open target/site/jacoco/index.html    # Mac
   xdg-open target/site/jacoco/index.html # Linux
   start target\site\jacoco\index.html   # Windows
   ```
   > The coverage report shows detailed metrics for all packages with excluded integration services.
