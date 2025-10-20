# Research Compendium

<div align="center">
  <h2>Project 24 - AI-Enabled Virtual Assistant for Aged Care</h2>
  <p><strong>Research Compendium & Supporting Materials</strong></p>
  <p><em>University of Auckland Part 4 Project</em></p>
</div>

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Research Compendium Structure](#research-compendium-structure)
3. [Technical Architecture](#technical-architecture)
4. [Implementation Details](#implementation-details)
5. [Experimental Methodology](#experimental-methodology)
6. [System Configuration](#system-configuration)
7. [Future Work & Integration Roadmap](#future-work--integration-roadmap)
8. [Individual Contributions](#individual-contributions)
9. [Research Materials](#research-materials)
10. [Getting Started](#getting-started)

---

## Project Overview

This research compendium contains comprehensive supporting materials for the Project 24 research project, enabling complete replication and assessment of the AI-enabled virtual assistant system for aged care. The compendium provides detailed documentation of experimental procedures, technical implementation, evaluation results, and future development pathways.

### **Research Objectives**
- Develop an AI-powered virtual assistant specifically designed for elderly users
- Create a dual-interface system supporting both elderly users and their caregivers
- Implement advanced memory management using semantic embeddings
- Integrate real-time avatar interaction with HeyGen streaming technology
- Establish comprehensive evaluation methodologies for longitudinal studies

### **Key Research Contributions**
- **Semantic Memory System**: ChromaDB-based vector storage with user-specific memory collections
- **Multimodal Interaction**: Speech-to-text, avatar generation, and text-based communication
- **Dual-User Interface**: Specialized interfaces for elderly users and caregiver oversight
- **Comprehensive Logging**: Detailed performance and interaction tracking for research evaluation
- **Modular Architecture**: Microservices-based design enabling independent scaling and development

---

## Research Compendium Structure

### **Main Project Implementation**
```
project24-aicompanion/
├── ai-companion/                    # Core AI services and backend
│   ├── backend/                     # Spring Boot Java backend
│   │   ├── src/main/java/com/example/ai_companion/
│   │   │   ├── controller/          # 11 REST API controllers
│   │   │   ├── service/             # 11 business logic services
│   │   │   ├── model/               # Data models and entities
│   │   │   ├── repository/          # MongoDB repositories
│   │   │   ├── config/              # Configuration classes
│   │   │   └── utils/               # Utility classes (including logger)
│   │   ├── src/main/resources/
│   │   │   └── application.properties
│   │   └── logs/                    # Experimental data collection
│   ├── embed-service/               # FastAPI memory embedding service
│   │   ├── memory_api.py            # ChromaDB integration
│   │   ├── requirements.txt
│   │   └── chroma-memory/           # Vector database storage
│   └── whisper-service/             # Speech-to-text service
│       ├── whisper_api.py           # OpenAI Whisper integration
│       └── requirements.txt
├── frontend/                        # React Native mobile app
│   ├── src/
│   │   ├── screens/                 # 28 specialized screens
│   │   │   ├── Auth/                # Authentication flows
│   │   │   ├── Elderly/             # Elderly user interface
│   │   │   ├── Caregiver/           # Caregiver dashboard
│   │   │   ├── ProfileFlow/         # User onboarding
│   │   │   └── shared/              # Common components
│   │   ├── components/              # 25+ reusable components
│   │   ├── hooks/                   # 32 custom React hooks
│   │   ├── services/                # 33 API service modules
│   │   └── navigation/              # Navigation configuration
│   ├── android/                     # Android-specific configuration
│   └── ios/                         # iOS-specific configuration
├── docker/                          # Database initialization
├── scripts/                         # Automation and deployment
└── docker-compose.yml              # Service orchestration
```

### **Research Documentation**
```
diagrams/
├── database.pdf                    # Database schema and relationships
└── projectArchitecture.pdf         # System architecture diagrams

evaluation/
└── evaluationresults.pdf          # Comprehensive evaluation results
```

---

## Technical Architecture

### **System Architecture Overview**

The Project 24 AI Companion system implements a microservices architecture with the following core components:

#### **Backend Services (Java Spring Boot)**
- **Authentication & Authorization**: Firebase-based user management with role-based access control
- **Memory Management**: Semantic memory storage and retrieval using ChromaDB
- **AI Processing**: LangChain4j integration with OpenAI GPT models
- **Avatar Integration**: HeyGen streaming API for real-time avatar generation
- **Game System**: Cognitive stimulation games with AI-powered interactions

#### **AI Services (Python FastAPI)**
- **Memory Embedding Service**: Sentence-transformers with ChromaDB for semantic search
- **Speech-to-Text Service**: OpenAI Whisper for multilingual audio transcription
- **Vector Database**: Persistent ChromaDB storage with user-specific collections

#### **Frontend Application (React Native)**
- **Cross-Platform Mobile App**: iOS and Android support with native performance
- **Dual-User Interface**: Specialized experiences for elderly users and caregivers
- **Real-Time Communication**: WebSocket connections for live avatar streaming
- **Accessibility Features**: Large fonts, voice commands, simplified navigation

### **Data Flow Architecture**

```mermaid
graph TB
    A[User Input] --> B[Frontend App]
    B --> C[Backend API]
    C --> D[LLM Service]
    C --> E[Memory Service]
    C --> F[HeyGen Service]
    E --> G[Embedding Service]
    G --> H[ChromaDB]
    D --> I[OpenAI API]
    F --> J[HeyGen API]
    K[Whisper Service] --> C
    L[MongoDB] --> C
```

---

## Implementation Details

### **Backend Controllers (11 Total)**

| Controller | Purpose | Key Endpoints |
|------------|---------|---------------|
| `ChatController` | Core chat functionality | `/memory/ask`, `/memory/ask-avatar`, `/memory/ask-game-avatar` |
| `UserController` | User management | `/users/profile`, `/users/update` |
| `AuthController` | Authentication | `/auth/register`, `/auth/login` |
| `MemoryController` | Memory operations | `/memory/introduce`, `/memory/recall` |
| `GameController` | Cognitive games | `/games/create`, `/games/sessions` |
| `DailySummaryController` | Daily summaries | `/daily-summaries/{userId}` |
| `ReminderController` | Reminder management | `/reminders/create`, `/reminders/list` |
| `WeatherController` | Weather integration | `/weather/current` |
| `LocationController` | Location services | `/location/update` |
| `ConnectionController` | User connections | `/connections/link` |
| `HeyGenController` | Avatar management | `/heygen/create-session` |

### **Frontend Screens (28 Total)**

#### **Authentication & Onboarding**
- `MainScreen.tsx` - Login and registration
- `RoleSelectionScreen.tsx` - User role selection
- `ProfileFlowScreen.tsx` - Multi-step user onboarding

#### **Elderly User Interface (7 screens)**
- `ElderlyHomeScreen.tsx` - Main dashboard
- `AiChatScreen.tsx` - AI conversation interface
- `DailyCheckinScreen.tsx` - Daily wellness check-ins
- `GamesScreen.tsx` - Cognitive games selection
- `GameSessionScreen.tsx` - Active game sessions
- `DailySummariesScreen.tsx` - Daily summary viewing
- `SummaryDetailScreen.tsx` - Detailed summary analysis

#### **Caregiver Interface (4 screens)**
- `CaregiverHomeScreen.tsx` - Caregiver dashboard
- `CaregiverMapScreen.tsx` - Location tracking
- `CaregiverDailySummariesScreen.tsx` - Elderly user summaries
- `CaregiverSummaryDetailScreen.tsx` - Detailed analysis

#### **Shared Components (4 screens)**
- `RemindersScreen.tsx` - Reminder management
- `MapsScreen.tsx` - Location services
- `SettingsScreen.tsx` - Application settings
- `SummaryScreen.tsx` - Summary viewing

### **Service Architecture**

#### **Core Services (11 Total)**
1. **`LLMService`** - AI conversation processing with memory integration
2. **`MemoryService`** - Semantic memory storage and retrieval
3. **`HeyGenService`** - Avatar session management and task processing
4. **`UserService`** - User profile and authentication management
5. **`GameService`** - Cognitive game session management
6. **`DailySummaryService`** - Daily summary generation and storage
7. **`ReminderService`** - Reminder extraction and management
8. **`ConnectionService`** - User relationship management
9. **`LocationService`** - Location tracking and weather integration
10. **`WeatherService`** - Weather data integration
11. **`CustomUserDetailsService`** - Spring Security integration

---

## Experimental Methodology

### **Comprehensive Logging System**

The research evaluation employs a sophisticated logging infrastructure integrated throughout the backend controllers, enabling detailed performance analysis and user interaction tracking.

#### **Logger Implementation**
```java
// Location: ai-companion/backend/src/main/java/com/example/ai_companion/utils/logger.java
public class logger {
    private static final String BASE_PATH = "logs/";
    
    public static void logToFile(String userId, String logContent) {
        // Creates timestamped log files with detailed performance metrics
        // Format: logs/user_{userId}_log.txt
    }
}
```

#### **Primary Evaluation Endpoints**

**1. Chat Interaction Logging (`/memory/ask-avatar`)**
```java
@PostMapping("/ask-avatar")
public ResponseEntity<?> askAvatar(@RequestParam String userId, @RequestBody Map<String, Object> payload) {
    double overallStart = System.currentTimeMillis() / 1000.0;
    String logFilename = String.format("msg_%d_%s.txt", (long)(overallStart * 1000), userId);
    
    // Comprehensive timing and performance logging
    logger.logToFile(logFilename, String.format("[START] ask-avatar for userId=%s at %.3f", userId, overallStart));
    
    // LLM Processing with detailed timing
    double llmStart = System.currentTimeMillis() / 1000.0;
    String aiText = llmService.generateAndTrack(userId, message, location, logFilename);
    double llmEnd = System.currentTimeMillis() / 1000.0;
    logger.logToFile(logFilename, String.format("[LLM] Duration: %.2f s", (llmEnd-llmStart)));
    
    // Avatar Processing with timing
    double avatarStart = System.currentTimeMillis() / 1000.0;
    Map<String, Object> taskResult = heyGenService.sendTaskToHeyGen(sessionId, aiText, "repeat", logFilename);
    double avatarEnd = System.currentTimeMillis() / 1000.0;
    logger.logToFile(logFilename, String.format("[Avatar] Duration: %.2f s", (avatarEnd-avatarStart)));
    
    // Async operations logging
    executor.submit(() -> {
        memoryService.extractAndStoreInsights(userId, message, aiText);
        logger.logToFile(logFilename, "Memory insight extraction completed");
    });
    
    double overallEnd = System.currentTimeMillis() / 1000.0;
    logger.logToFile(logFilename, String.format("[END] Total duration: %.2f s", (overallEnd-overallStart)));
    
    return ApiResponseBuilder.build(HttpStatus.OK, "AI and avatar response", result);
}
```

**2. Game Interaction Logging (`/memory/ask-game-avatar`)**
```java
@PostMapping("/ask-game-avatar")
public ResponseEntity<?> askGameAvatar(@RequestParam String userId, @RequestBody Map<String, Object> payload) {
    String logFilename = String.format("game_msg_%d_%s.txt", (long)(overallStart * 1000), userId);
    
    // Game-specific processing with cognitive metrics
    String gameResponse = gameService.processGameMessage(gameSessionId, userId, message);
    Map<String, Object> taskResult = heyGenService.sendTaskToHeyGen(sessionId, gameResponse, "repeat", logFilename);
    
    logger.logToFile(logFilename, String.format("[END] Game interaction completed in %.2f s", (overallEnd-overallStart)));
    return ApiResponseBuilder.build(HttpStatus.OK, "Game response", result);
}
```

### **Data Collection Metrics**

#### **Performance Metrics**
- **Response Time**: End-to-end processing duration
- **LLM Processing Time**: Language model inference duration
- **Avatar Generation Time**: HeyGen task processing duration
- **Memory Retrieval Time**: ChromaDB query and processing time
- **Async Operations Time**: Background processing duration

#### **Accuracy Metrics**
- **Memory Retrieval Accuracy**: Semantic search precision and recall
- **Emotional Congruence**: AI response alignment with user emotional state
- **Summary Accuracy**: Daily summary generation correctness
- **Hallucination Rate**: Frequency of factually incorrect responses

#### **System Metrics**
- **Avatar Sync Errors**: Audio-visual synchronization issues
- **Memory Storage Success**: Successful embedding operations
- **Error Rates**: System exception frequency
- **User Engagement**: Interaction frequency and duration

### **Log File Structure**

#### **Naming Convention**
- **Chat interactions**: `msg_{timestamp}_{userId}.txt`
- **Game interactions**: `game_msg_{timestamp}_{userId}.txt`
- **Daily summaries**: `summary_{timestamp}_{userId}.txt`
- **User-specific logs**: `user_{userId}_log.txt`

#### **Log Content Format**
```
==== [2025-01-19T14:30:25.123] ====
[START] ask-avatar for userId=6816ef4f17ffda7deab60726 at 1729338625.123
Received message: 'Hello, how are you today?'

[LLM] Start at 1729338625.456
[LLM] End at 1729338627.789 (duration: 2.33 s)

[Avatar] Start at 1729338627.789
[Avatar] End at 1729338628.234 (duration: 0.45 s)

Memory insight extraction (async): 0.12 s
Message saving (async): 0.05 s
Reminder extraction (async): 0.08 s

[END] ask-avatar for userId=6816ef4f17ffda7deab60726 at 1729338628.234 (total duration: 3.11 s)
```

### **Embedding Service Testing & Analysis**

#### **1. Similarity Word Analysis**

To analyze what similarity words are returned from the embedding service, add detailed logging to the memory retrieval process:

**Step 1: Add Similarity Logging to Backend**
```java
// Modify: ai-companion/backend/src/main/java/com/example/ai_companion/service/LLMService.java
// Around line 159 in fetchMemoryContext() method

public String fetchMemoryContext(String userId, String query, String logFilename) {
    try {
        Map<String, Object> body = new HashMap<>();
        body.put("user_id", userId);
        body.put("query", query);
        body.put("top_k", 5);
        
        // Log the query being sent
        if (logFilename != null) {
            logger.logToFile(logFilename, String.format("[MEMORY] Querying memories for: '%s'", query));
        }
        
        ResponseEntity<Map> response = restTemplate.postForEntity(
            embedServiceUrl + "/recall", 
            new HttpEntity<>(body, headers), 
            Map.class
        );
        
        if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
            Map<String, Object> responseBody = response.getBody();
            List<Map<String, Object>> memories = (List<Map<String, Object>>) responseBody.get("memories");
            
            // Log detailed similarity analysis
            if (logFilename != null && memories != null) {
                logger.logToFile(logFilename, String.format("[MEMORY] Retrieved %d memories:", memories.size()));
                for (int i = 0; i < memories.size(); i++) {
                    Map<String, Object> memory = memories.get(i);
                    String content = (String) memory.get("content");
                    Double similarity = (Double) memory.get("similarity");
                    String timestamp = (String) memory.get("timestamp");
                    
                    logger.logToFile(logFilename, String.format(
                        "[MEMORY] %d. Similarity: %.3f | Content: '%s' | Time: %s", 
                        i+1, similarity, content, timestamp
                    ));
                }
            }
            
            return formatMemoriesForPrompt(memories);
        }
    } catch (Exception e) {
        if (logFilename != null) {
            logger.logToFile(logFilename, String.format("[MEMORY] Error retrieving memories: %s", e.getMessage()));
        }
    }
    return "";
}
```

**Step 2: Enhanced Embedding Service Logging**
```python
# Modify: ai-companion/embed-service/memory_api.py
# Add detailed logging to recall_memories function

@app.post("/recall")
async def recall_memories(query: RecallInput):
    try:
        collection = client.get_collection(f"user_{query.user_id}")
        
        # Log the query
        print(f"[EMBED-SERVICE] User {query.user_id} querying: '{query.query}'")
        
        # Query the collection
        results = collection.query(
            query_texts=[query.query],
            n_results=query.top_k,
            where={"user_id": query.user_id} if query.user_id else None
        )
        
        memories = []
        if results['documents'] and results['documents'][0]:
            for i, (doc, metadata, distance) in enumerate(zip(
                results['documents'][0], 
                results['metadatas'][0], 
                results['distances'][0]
            )):
                similarity = 1 - distance  # Convert distance to similarity
                
                # Log each retrieved memory with similarity score
                print(f"[EMBED-SERVICE] Memory {i+1}: Similarity={similarity:.3f}, Content='{doc[:50]}...'")
                
                memories.append({
                    "content": doc,
                    "similarity": similarity,
                    "timestamp": metadata.get("timestamp", ""),
                    "metadata": metadata
                })
        
        print(f"[EMBED-SERVICE] Returning {len(memories)} memories for user {query.user_id}")
        return {"memories": memories}
        
    except Exception as e:
        print(f"[EMBED-SERVICE] Error in recall_memories: {str(e)}")
        return {"memories": [], "error": str(e)}
```

#### **2. Manual Embedding Service Testing**

**Step 1: List All Semantic Memories for a User**

Create a test script to manually inspect all memories stored for a specific user:

```python
# Create: ai-companion/embed-service/test_memories.py
import chromadb
import json
from datetime import datetime

def list_user_memories(user_id: str):
    """List all memories stored for a specific user"""
    client = chromadb.PersistentClient(path="./chroma-memory")
    
    try:
        collection = client.get_collection(f"user_{user_id}")
        
        # Get all documents in the collection
        results = collection.get()
        
        print(f"\n=== ALL MEMORIES FOR USER: {user_id} ===")
        print(f"Total memories: {len(results['documents'])}")
        
        for i, (doc, metadata) in enumerate(zip(results['documents'], results['metadatas'])):
            timestamp = metadata.get('timestamp', 'Unknown')
            print(f"\n{i+1}. Memory:")
            print(f"   Content: {doc}")
            print(f"   Timestamp: {timestamp}")
            print(f"   Metadata: {json.dumps(metadata, indent=2)}")
            
    except Exception as e:
        print(f"Error retrieving memories for user {user_id}: {str(e)}")

def test_similarity_search(user_id: str, query: str, top_k: int = 5):
    """Test similarity search for a specific query"""
    client = chromadb.PersistentClient(path="./chroma-memory")
    
    try:
        collection = client.get_collection(f"user_{user_id}")
        
        print(f"\n=== SIMILARITY SEARCH TEST ===")
        print(f"User: {user_id}")
        print(f"Query: '{query}'")
        print(f"Top K: {top_k}")
        
        results = collection.query(
            query_texts=[query],
            n_results=top_k,
            where={"user_id": user_id}
        )
        
        if results['documents'] and results['documents'][0]:
            print(f"\nFound {len(results['documents'][0])} similar memories:")
            
            for i, (doc, metadata, distance) in enumerate(zip(
                results['documents'][0], 
                results['metadatas'][0], 
                results['distances'][0]
            )):
                similarity = 1 - distance
                timestamp = metadata.get('timestamp', 'Unknown')
                
                print(f"\n{i+1}. Similarity Score: {similarity:.3f}")
                print(f"   Content: {doc}")
                print(f"   Timestamp: {timestamp}")
                print(f"   Distance: {distance:.3f}")
        else:
            print("No memories found for this query.")
            
    except Exception as e:
        print(f"Error in similarity search: {str(e)}")

if __name__ == "__main__":
    # Example usage
    user_id = "6816ef4f17ffda7deab60726"  # Replace with actual user ID
    
    # List all memories
    list_user_memories(user_id)
    
    # Test similarity search
    test_similarity_search(user_id, "How are you feeling today?", top_k=3)
    test_similarity_search(user_id, "What did we talk about yesterday?", top_k=5)
```

**Step 2: Manual API Testing with cURL**

Test the embedding service directly using HTTP requests:

```bash
# Navigate to the embed-service directory
cd project24-aicompanion/ai-companion/embed-service

# Start the service (if not already running)
uvicorn memory_api:app --reload --host 0.0.0.0 --port 8000

# Test 1: List all memories for a user
curl -X POST "http://localhost:8000/recall" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "6816ef4f17ffda7deab60726",
    "query": "test query",
    "top_k": 10
  }'

# Test 2: Test similarity search with specific query
curl -X POST "http://localhost:8000/recall" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "6816ef4f17ffda7deab60726",
    "query": "How are you feeling today?",
    "top_k": 5
  }'

# Test 3: Store a new memory
curl -X POST "http://localhost:8000/store" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "6816ef4f17ffda7deab60726",
    "content": "I had a great day today and went for a walk in the park",
    "timestamp": "2025-01-19T15:30:00Z"
  }'
```

**Step 3: Enhanced Testing Script**

Create a comprehensive testing script:

```python
# Create: ai-companion/embed-service/comprehensive_test.py
import requests
import json
import time
from datetime import datetime

class EmbeddingServiceTester:
    def __init__(self, base_url="http://localhost:8000"):
        self.base_url = base_url
        
    def test_user_memories(self, user_id: str):
        """Comprehensive test of user's memory system"""
        print(f"\n{'='*60}")
        print(f"TESTING MEMORY SYSTEM FOR USER: {user_id}")
        print(f"{'='*60}")
        
        # Test 1: Basic recall
        self.test_basic_recall(user_id)
        
        # Test 2: Similarity analysis
        self.test_similarity_analysis(user_id)
        
        # Test 3: Store and retrieve
        self.test_store_and_retrieve(user_id)
        
        # Test 4: Edge cases
        self.test_edge_cases(user_id)
    
    def test_basic_recall(self, user_id: str):
        """Test basic memory recall functionality"""
        print(f"\n--- TEST 1: Basic Memory Recall ---")
        
        response = requests.post(f"{self.base_url}/recall", json={
            "user_id": user_id,
            "query": "test",
            "top_k": 5
        })
        
        if response.status_code == 200:
            data = response.json()
            memories = data.get('memories', [])
            print(f"✓ Retrieved {len(memories)} memories")
            
            for i, memory in enumerate(memories):
                similarity = memory.get('similarity', 0)
                content = memory.get('content', '')[:50]
                print(f"  {i+1}. Similarity: {similarity:.3f} | Content: '{content}...'")
        else:
            print(f"✗ Error: {response.status_code} - {response.text}")
    
    def test_similarity_analysis(self, user_id: str):
        """Test similarity analysis with different query types"""
        print(f"\n--- TEST 2: Similarity Analysis ---")
        
        test_queries = [
            "How are you feeling?",
            "What did we talk about?",
            "Tell me about your day",
            "Do you remember anything?",
            "How is your health?"
        ]
        
        for query in test_queries:
            print(f"\nQuery: '{query}'")
            response = requests.post(f"{self.base_url}/recall", json={
                "user_id": user_id,
                "query": query,
                "top_k": 3
            })
            
            if response.status_code == 200:
                data = response.json()
                memories = data.get('memories', [])
                
                if memories:
                    best_match = memories[0]
                    similarity = best_match.get('similarity', 0)
                    content = best_match.get('content', '')[:40]
                    print(f"  Best match: {similarity:.3f} - '{content}...'")
                else:
                    print(f"  No matches found")
            else:
                print(f"  Error: {response.status_code}")
    
    def test_store_and_retrieve(self, user_id: str):
        """Test storing and immediately retrieving a memory"""
        print(f"\n--- TEST 3: Store and Retrieve ---")
        
        test_content = f"Test memory created at {datetime.now().isoformat()}"
        
        # Store memory
        store_response = requests.post(f"{self.base_url}/store", json={
            "user_id": user_id,
            "content": test_content,
            "timestamp": datetime.now().isoformat()
        })
        
        if store_response.status_code == 200:
            print(f"✓ Stored memory: '{test_content[:30]}...'")
            
            # Wait a moment for indexing
            time.sleep(1)
            
            # Retrieve memory
            retrieve_response = requests.post(f"{self.base_url}/recall", json={
                "user_id": user_id,
                "query": "test memory",
                "top_k": 5
            })
            
            if retrieve_response.status_code == 200:
                data = retrieve_response.json()
                memories = data.get('memories', [])
                
                found = False
                for memory in memories:
                    if test_content in memory.get('content', ''):
                        similarity = memory.get('similarity', 0)
                        print(f"✓ Retrieved stored memory with similarity: {similarity:.3f}")
                        found = True
                        break
                
                if not found:
                    print(f"✗ Stored memory not found in retrieval")
            else:
                print(f"✗ Error retrieving: {retrieve_response.status_code}")
        else:
            print(f"✗ Error storing: {store_response.status_code}")
    
    def test_edge_cases(self, user_id: str):
        """Test edge cases and error handling"""
        print(f"\n--- TEST 4: Edge Cases ---")
        
        # Test with empty query
        response = requests.post(f"{self.base_url}/recall", json={
            "user_id": user_id,
            "query": "",
            "top_k": 5
        })
        print(f"Empty query: {response.status_code}")
        
        # Test with very long query
        long_query = "This is a very long query " * 20
        response = requests.post(f"{self.base_url}/recall", json={
            "user_id": user_id,
            "query": long_query,
            "top_k": 5
        })
        print(f"Long query: {response.status_code}")
        
        # Test with non-existent user
        response = requests.post(f"{self.base_url}/recall", json={
            "user_id": "non_existent_user",
            "query": "test",
            "top_k": 5
        })
        print(f"Non-existent user: {response.status_code}")

# Usage
if __name__ == "__main__":
    tester = EmbeddingServiceTester()
    
    # Test with actual user ID from your system
    user_id = "6816ef4f17ffda7deab60726"  # Replace with actual user ID
    tester.test_user_memories(user_id)
```

#### **3. Log Analysis for Similarity Patterns**

Add logging to analyze similarity patterns over time:

```bash
# Navigate to logs directory
cd project24-aicompanion/ai-companion/backend/logs/

# Extract similarity scores from logs
grep "Similarity:" *.txt | awk '{print $NF}' | sort -n

# Find queries with highest similarity matches
grep -B1 -A1 "Similarity: 0\.[8-9]" *.txt

# Analyze similarity distribution
grep "Similarity:" *.txt | awk '{print $NF}' | awk '{if($1<0.3) low++; else if($1<0.6) med++; else high++} END {print "Low:", low, "Medium:", med, "High:", high}'

# Find specific user's memory patterns
grep "userId=6816ef4f17ffda7deab60726" *.txt | grep "Similarity:"
```

#### **4. Real-time Similarity Monitoring**

Add real-time monitoring to track similarity patterns:

```java
// Add to: ai-companion/backend/src/main/java/com/example/ai_companion/service/LLMService.java
// In fetchMemoryContext method

private void logSimilarityAnalysis(String userId, String query, List<Map<String, Object>> memories, String logFilename) {
    if (logFilename != null && memories != null) {
        double avgSimilarity = memories.stream()
            .mapToDouble(m -> (Double) m.get("similarity"))
            .average()
            .orElse(0.0);
        
        double maxSimilarity = memories.stream()
            .mapToDouble(m -> (Double) m.get("similarity"))
            .max()
            .orElse(0.0);
        
        logger.logToFile(logFilename, String.format(
            "[SIMILARITY-ANALYSIS] Query: '%s' | Avg: %.3f | Max: %.3f | Count: %d",
            query, avgSimilarity, maxSimilarity, memories.size()
        ));
        
        // Log if similarity is unusually low
        if (maxSimilarity < 0.3) {
            logger.logToFile(logFilename, String.format(
                "[SIMILARITY-WARNING] Low similarity match for query: '%s' (max: %.3f)",
                query, maxSimilarity
            ));
        }
    }
}
```

This comprehensive logging and testing framework allows you to:

1. **Analyze Similarity Patterns**: See exactly what words/phrases are matching and their similarity scores
2. **Manual Testing**: Test the embedding service directly with specific user IDs and queries
3. **Memory Inspection**: View all semantic memories stored for any user
4. **Performance Monitoring**: Track similarity patterns over time
5. **Debugging**: Identify issues with memory retrieval and storage

The logging will help you understand how well the semantic search is working and identify areas for improvement in the memory system.

---

## System Configuration

### **Backend Configuration**

#### **LLM Model Configuration**
**File**: `ai-companion/backend/src/main/java/com/example/ai_companion/config/LLMConfig.java`

**Current OpenAI Configuration:**
```java
@Bean
public ChatLanguageModel chatLanguageModel() {
    return OpenAiChatModel.builder()
            .apiKey(openAiApiKey)
            .defaultRequestParameters(ChatRequestParameters.builder()
                    .modelName("gpt-4o-mini")  // ← Change LLM model here
                    .temperature(0.7)          // ← Adjust creativity (0.0-1.0)
                    .build())
            .build();
}
```

**Configurable OpenAI Parameters:**
- **Model Selection**: `gpt-4o`, `gpt-4o-mini`, `gpt-3.5-turbo`, `gpt-4-turbo`
- **Temperature**: 0.0 (deterministic) to 1.0 (maximum creativity)
- **API Key**: Set `OPENAI_API_KEY` in `.env` file
  - **Demo Mode**: Set to `"demo"` for free testing with LangChain4j's demo service
  - **Free Limit**: LangChain4j provides free demo access with usage limits for development/testing

#### **Alternative LLM Provider Configurations**

**1. Google Gemini Configuration**
```java
// Add dependency to pom.xml:
// <dependency>
//     <groupId>dev.langchain4j</groupId>
//     <artifactId>langchain4j-google-gemini</artifactId>
//     <version>0.29.1</version>
// </dependency>

@Bean
public ChatLanguageModel chatLanguageModel() {
    return GeminiChatModel.builder()
            .apiKey(geminiApiKey)  // Set GEMINI_API_KEY in .env
            .modelName("gemini-1.5-flash")  // or "gemini-1.5-pro"
            .temperature(0.7)
            .topP(0.9)
            .maxOutputTokens(2048)
            .build();
}
```

**2. Anthropic Claude Configuration**
```java
// Add dependency to pom.xml:
// <dependency>
//     <groupId>dev.langchain4j</groupId>
//     <artifactId>langchain4j-anthropic</artifactId>
//     <version>0.29.1</version>
// </dependency>

@Bean
public ChatLanguageModel chatLanguageModel() {
    return AnthropicChatModel.builder()
            .apiKey(anthropicApiKey)  // Set ANTHROPIC_API_KEY in .env
            .modelName("claude-3-sonnet-20240229")  // or "claude-3-haiku-20240307"
            .temperature(0.7)
            .maxTokens(2048)
            .build();
}
```

**3. Azure OpenAI Configuration**
```java
@Bean
public ChatLanguageModel chatLanguageModel() {
    return AzureOpenAiChatModel.builder()
            .apiKey(azureApiKey)  // Set AZURE_OPENAI_API_KEY in .env
            .endpoint("https://your-resource.openai.azure.com/")
            .apiVersion("2024-02-15-preview")
            .deploymentName("gpt-4")  // Your deployment name
            .temperature(0.7)
            .build();
}
```

**4. Ollama Local Model Configuration**
```java
// Add dependency to pom.xml:
// <dependency>
//     <groupId>dev.langchain4j</groupId>
//     <artifactId>langchain4j-ollama</artifactId>
//     <version>0.29.1</version>
// </dependency>

@Bean
public ChatLanguageModel chatLanguageModel() {
    return OllamaChatModel.builder()
            .baseUrl("http://localhost:11434")  // Ollama default port
            .modelName("llama2")  // or "mistral", "codellama", etc.
            .temperature(0.7)
            .build();
}
```

**5. Multi-Provider Configuration with Fallback**
```java
@Configuration
public class LLMConfig {
    
    @Value("${llm.provider:openai}")
    private String llmProvider;
    
    @Value("${openai.api.key:}")
    private String openAiApiKey;
    
    @Value("${gemini.api.key:}")
    private String geminiApiKey;
    
    @Value("${anthropic.api.key:}")
    private String anthropicApiKey;
    
    @Bean
    @Primary
    public ChatLanguageModel primaryChatLanguageModel() {
        return switch (llmProvider.toLowerCase()) {
            case "openai" -> createOpenAiModel();
            case "gemini" -> createGeminiModel();
            case "anthropic" -> createAnthropicModel();
            case "ollama" -> createOllamaModel();
            default -> createOpenAiModel();
        };
    }
    
    @Bean
    @Qualifier("fallback")
    public ChatLanguageModel fallbackChatLanguageModel() {
        return createOpenAiModel();  // Always fallback to OpenAI
    }
    
    private ChatLanguageModel createOpenAiModel() {
        return OpenAiChatModel.builder()
                .apiKey(openAiApiKey)
                .modelName("gpt-4o-mini")
                .temperature(0.7)
                .build();
    }
    
    private ChatLanguageModel createGeminiModel() {
        return GeminiChatModel.builder()
                .apiKey(geminiApiKey)
                .modelName("gemini-1.5-flash")
                .temperature(0.7)
                .build();
    }
    
    private ChatLanguageModel createAnthropicModel() {
        return AnthropicChatModel.builder()
                .apiKey(anthropicApiKey)
                .modelName("claude-3-sonnet-20240229")
                .temperature(0.7)
                .build();
    }
    
    private ChatLanguageModel createOllamaModel() {
        return OllamaChatModel.builder()
                .baseUrl("http://localhost:11434")
                .modelName("llama2")
                .temperature(0.7)
                .build();
    }
}
```

#### **API Keys Configuration**

**Required API Keys for Full System Operation:**

**1. Application Properties Configuration**
**File**: `ai-companion/backend/src/main/resources/application.properties`

```properties
# Application Configuration
spring.application.name=backend
spring.data.mongodb.uri=mongodb://localhost:27017/ai-companion

# External API Configuration
weather.api.key=${WEATHER_API_KEY}
avatar.api.key=${AVATAR_STREAMING_API_KEY}

# LLM Provider Configuration
llm.provider=${LLM_PROVIDER:openai}
openai.api.key=${OPENAI_API_KEY}
gemini.api.key=${GEMINI_API_KEY}
anthropic.api.key=${ANTHROPIC_API_KEY}
azure.openai.api.key=${AZURE_OPENAI_API_KEY}
azure.openai.endpoint=${AZURE_OPENAI_ENDPOINT}
azure.openai.deployment.name=${AZURE_OPENAI_DEPLOYMENT_NAME}

# Service URLs
embed.service.url=${EMBED_SERVICE_URL:http://localhost:8000}
whisper.service.url=${WHISPER_SERVICE_URL:http://localhost:8001}

# Load environment variables from .env file
spring.config.import=optional:file:.env[.properties],optional:file:../.env[.properties]
```

**2. Environment Variables Configuration**

**Example Environment File**: `project24-aicompanion/.env.example`

The project includes a comprehensive `.env.example` file with all required environment variables. To set up your environment:

1. **Copy the example file:**
   ```bash
   cd project24-aicompanion
   cp .env.example .env
   ```
   
   **Note**: The backend automatically loads environment variables from the main `.env` file in the project root. No separate backend `.env` file is needed.

2. **Set up Firebase configuration files:**
   ```bash
   # Copy Firebase config templates
   cp frontend/google-services.json.example frontend/google-services.json
   cp frontend/GoogleService-Info.plist.example frontend/GoogleService-Info.plist
   cp frontend/android/app/google-services.json.example frontend/android/app/google-services.json
   cp frontend/ios/project24/GoogleService-Info.plist.example frontend/ios/project24/GoogleService-Info.plist
   
   # Edit these files with your actual Firebase project details
   # Get your Firebase config from: https://console.firebase.google.com/
   ```

3. **Edit the `.env` file with your actual API keys:**
   ```bash
   # Required API Keys
   OPENAI_API_KEY=demo  # Free demo mode for testing
   # OR: OPENAI_API_KEY=your_actual_openai_key_here
   WEATHER_API_KEY=your_actual_weather_key_here
   AVATAR_STREAMING_API_KEY=your_actual_heygen_key_here
   
   # Optional LLM Providers
   GEMINI_API_KEY=your_gemini_key_here
   ANTHROPIC_API_KEY=your_anthropic_key_here
   ```

**Key Environment Variables:**
```bash
# ===========================================
# REQUIRED API KEYS FOR SYSTEM OPERATION
# ===========================================

# LLM Provider Configuration
LLM_PROVIDER=openai  # Options: openai, gemini, anthropic, azure, ollama
OPENAI_API_KEY=your_openai_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# Azure OpenAI Configuration (if using Azure)
AZURE_OPENAI_API_KEY=your_azure_openai_api_key_here
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
AZURE_OPENAI_DEPLOYMENT_NAME=your-deployment-name

# External Service APIs
WEATHER_API_KEY=your_openweathermap_api_key_here
AVATAR_STREAMING_API_KEY=your_heygen_api_key_here

# Service URLs (for local development)
EMBED_SERVICE_URL=http://localhost:8000
WHISPER_SERVICE_URL=http://localhost:8001

# Database Configuration (if not using Docker)
MONGODB_URI=mongodb://localhost:27017/ai-companion
```

**Quick Setup:**
```bash
# Navigate to project directory
cd project24-aicompanion

# Copy example environment file
cp .env.example .env

# Edit with your API keys
nano .env  # or use your preferred editor

# Start the services
./scripts/start-ios-dev.sh
```

**3. Complete API Keys List**

| Service | API Key Required | Purpose | Where to Get |
|---------|------------------|---------|--------------|
| **OpenAI** | `OPENAI_API_KEY` | GPT models for AI responses | [OpenAI Platform](https://platform.openai.com/api-keys) or `"demo"` for free testing |
| **Google Gemini** | `GEMINI_API_KEY` | Alternative LLM provider | [Google AI Studio](https://makersuite.google.com/app/apikey) |
| **Anthropic Claude** | `ANTHROPIC_API_KEY` | Alternative LLM provider | [Anthropic Console](https://console.anthropic.com/) |
| **Azure OpenAI** | `AZURE_OPENAI_API_KEY` | Enterprise OpenAI deployment | [Azure Portal](https://portal.azure.com/) |
| **HeyGen** | `AVATAR_STREAMING_API_KEY` | Avatar generation and streaming | [HeyGen Platform](https://app.heygen.com/) |
| **OpenWeatherMap** | `WEATHER_API_KEY` | Weather data integration | [OpenWeatherMap API](https://openweathermap.org/api) |
| **MongoDB** | `MONGODB_URI` | Database connection | Local installation or MongoDB Atlas |

**4. Optional API Keys for Enhanced Features**

| Service | API Key | Purpose | Required |
|---------|---------|---------|----------|
| **Firebase** | `FIREBASE_CONFIG` | User authentication | Yes (for production) |
| **Firebase Config** | `google-services.json`, `GoogleService-Info.plist` | Mobile app configuration | Yes (for mobile apps) |
| **Google Maps** | `GOOGLE_MAPS_API_KEY` | Location services | Optional |
| **Twilio** | `TWILIO_API_KEY` | SMS notifications | Optional |
| **SendGrid** | `SENDGRID_API_KEY` | Email notifications | Optional |

**5. Provider-Specific Configuration Examples**

**OpenAI Configuration:**
```bash
LLM_PROVIDER=openai
OPENAI_API_KEY=sk-your-openai-key-here
# OR for free testing:
OPENAI_API_KEY=demo
```

**Google Gemini Configuration:**
```bash
LLM_PROVIDER=gemini
GEMINI_API_KEY=your-gemini-key-here
```

**Firebase Configuration:**
```bash
# 1. Copy Firebase config templates
cp frontend/google-services.json.example frontend/google-services.json
cp frontend/GoogleService-Info.plist.example frontend/GoogleService-Info.plist
cp frontend/android/app/google-services.json.example frontend/android/app/google-services.json
cp frontend/ios/project24/GoogleService-Info.plist.example frontend/ios/project24/GoogleService-Info.plist

# 2. Get your Firebase config from: https://console.firebase.google.com/
# 3. Replace placeholder values in the copied files with your actual Firebase project details
```

**Anthropic Claude Configuration:**
```bash
LLM_PROVIDER=anthropic
ANTHROPIC_API_KEY=sk-ant-your-anthropic-key-here
```

**Azure OpenAI Configuration:**
```bash
LLM_PROVIDER=azure
AZURE_OPENAI_API_KEY=your-azure-key-here
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4
```

**Ollama Local Configuration:**
```bash
LLM_PROVIDER=ollama
# No API key needed - runs locally
```

**6. Switching LLM Providers**

To switch between providers, simply:

1. **Update Environment Variable:**
   ```bash
   LLM_PROVIDER=gemini  # Change from openai to gemini
   ```

2. **Add Required API Key:**
   ```bash
   GEMINI_API_KEY=your-gemini-key-here
   ```

3. **Restart Backend Service:**
   ```bash
   cd ai-companion/backend
   mvn spring-boot:run
   ```

#### **Memory Retrieval Configuration**
**File**: `ai-companion/backend/src/main/java/com/example/ai_companion/service/LLMService.java`

```java
// Line 159: Number of memories to retrieve
body.put("top_k", 5);  // ← Change number of memories retrieved

// Line 125: Number of chat history messages
List<Message> messages = messageRepository.findTop10ByUserIdOrderByTimestampDesc(userId);
// ↑ Change "Top10" to adjust chat history length
```

### **Embedding Service Configuration**

#### **Sentence Transformer Model**
**File**: `ai-companion/embed-service/memory_api.py`

```python
# Line 11: Sentence Transformer model
model = SentenceTransformer("all-MiniLM-L6-v2")  # ← Change embedding model here

# Line 76: Similarity threshold
SIMILARITY_THRESHOLD = 0.3  # ← Adjust similarity threshold (0.0-1.0)

# Line 89: Number of results returned
top_10 = sorted(combined, key=lambda x: -x["similarity"])[:10]  # ← Change max results
```

**Available Models:**
- `all-MiniLM-L6-v2` - Current (balanced performance)
- `all-mpnet-base-v2` - Higher quality, larger size
- `all-MiniLM-L12-v2` - Better quality than L6
- `paraphrase-multilingual-MiniLM-L12-v2` - Multilingual support

### **Docker Configuration**

#### **Service Ports** (`docker-compose.yml`)
```yaml
backend:
  ports:
    - "8080:8080"  # ← Change backend port

embed-service:
  ports:
    - "8000:8000"  # ← Change embedding service port

whisper-service:
  ports:
    - "8001:8001"  # ← Change whisper service port

mongodb:
  ports:
    - "27017:27017"
```

---

## Future Work & Integration Roadmap

Based on comprehensive analysis of the current implementation and research findings, the following future work areas have been identified with detailed integration steps for the project24-aicompanion system.

### **6.1 Memory Governance and Provenance Tracking**

**Current Implementation Analysis:**
The system currently uses ChromaDB for vector storage without formal provenance tracking. The `MemoryService` class (`ai-companion/backend/src/main/java/com/example/ai_companion/service/MemoryService.java`) handles memory operations but lacks lineage tracking.

**Integration Steps:**

1. **Create Memory Ledger Service**
   - **New File**: `ai-companion/backend/src/main/java/com/example/ai_companion/service/MemoryLedgerService.java`
   ```java
   @Service
   public class MemoryLedgerService {
       @Autowired
       private MemoryLedgerRepository memoryLedgerRepository;
       
       public void logMemoryOperation(String embeddingId, String sourceMessageId, 
                                     String modelVersion, double confidenceScore) {
           MemoryLedger ledger = new MemoryLedger();
           ledger.setEmbeddingId(embeddingId);
           ledger.setSourceMessageId(sourceMessageId);
           ledger.setModelVersion(modelVersion);
           ledger.setConfidenceScore(confidenceScore);
           ledger.setTimestamp(Instant.now());
           memoryLedgerRepository.save(ledger);
       }
   }
   ```

2. **Add Memory Ledger Entity**
   - **New File**: `ai-companion/backend/src/main/java/com/example/ai_companion/model/MemoryLedger.java`
   ```java
   @Document(collection = "memory_ledger")
   public class MemoryLedger {
       @Id
       private String id;
       private String embeddingId;
       private String sourceMessageId;
       private String modelVersion;
       private double confidenceScore;
       private Instant timestamp;
       private String userId;
   }
   ```

3. **Update Memory Service**
   - **Modify**: `ai-companion/backend/src/main/java/com/example/ai_companion/service/MemoryService.java`
   - Add logging calls in `extractAndStoreInsights()` method
   - Integrate with `MemoryLedgerService` for provenance tracking

4. **Create Memory Management Controller**
   - **New File**: `ai-companion/backend/src/main/java/com/example/ai_companion/controller/MemoryManagementController.java`
   ```java
   @RestController
   @RequestMapping("/memory-management")
   public class MemoryManagementController {
       
       @PostMapping("/correct")
       public ResponseEntity<?> correctMemory(@RequestParam String memoryId, 
                                           @RequestBody String correctedContent) {
           // Implement memory correction logic
       }
       
       @DeleteMapping("/delete")
       public ResponseEntity<?> deleteMemory(@RequestParam String memoryId) {
           // Implement memory deletion with rollback
       }
       
       @GetMapping("/audit")
       public ResponseEntity<?> auditMemory(@RequestParam String userId) {
           // Return memory audit trail
       }
   }
   ```

5. **Frontend Memory Management Interface**
   - **New File**: `frontend/src/components/MemoryManagementModal.tsx`
   - **New File**: `frontend/src/screens/Caregiver/MemoryDashboard.tsx`
   - Add memory correction interface for caregivers
   - Implement memory audit trail visualization

### **6.2 Selective Embedding and Context Filtering**

**Current Implementation Analysis:**
The embedding service (`ai-companion/embed-service/memory_api.py`) currently treats all messages equally. The `recall_memories()` function uses a simple similarity threshold without content weighting.

**Integration Steps:**

1. **Enhance Embedding Service**
   - **Modify**: `ai-companion/embed-service/memory_api.py`
   ```python
   # Add tiered embedding system
   def store_memory_with_tier(data: StoreInput):
       # Analyze message content for tier assignment
       tier = analyze_content_tier(data.content)
       
       # Store with metadata
       collection.add(
           documents=[data.content],
           metadatas=[{
               "user_id": data.user_id,
               "timestamp": data.timestamp,
               "tier": tier,
               "sentiment_score": analyze_sentiment(data.content),
               "topic_label": extract_topic(data.content),
               "interaction_type": data.interaction_type
           }],
           ids=[str(uuid4())]
       )
   
   def recall_memories_weighted(query: RecallInput):
       # Implement weighted similarity scoring
       results = collection.query(
           query_texts=[query.query],
           n_results=query.top_k * 2,  # Get more for filtering
           where={"user_id": query.user_id}
       )
       
       # Apply tier-based weighting
       weighted_results = apply_tier_weighting(results, query.user_id)
       return weighted_results[:query.top_k]
   ```

2. **Add Sentiment Analysis Integration**
   - **New File**: `ai-companion/embed-service/sentiment_analyzer.py`
   ```python
   from transformers import pipeline
   
   sentiment_analyzer = pipeline("sentiment-analysis")
   
   def analyze_sentiment(text: str) -> float:
       result = sentiment_analyzer(text)
       return result[0]['score'] if result[0]['label'] == 'POSITIVE' else -result[0]['score']
   ```

3. **Update Backend Memory Service**
   - **Modify**: `ai-companion/backend/src/main/java/com/example/ai_companion/service/MemoryService.java`
   - Add weighted retrieval algorithm
   - Implement memory clustering and summarization

4. **Configuration Updates**
   - **Modify**: `ai-companion/backend/src/main/resources/application.properties`
   ```properties
   # Embedding tier configuration
   memory.tier1.threshold=0.8
   memory.tier2.threshold=0.5
   memory.tier3.threshold=0.3
   memory.sentiment.weight=0.3
   memory.topic.weight=0.2
   ```

### **6.3 Multilingual Semantic Alignment**

**Current Implementation Analysis:**
The system uses Whisper for speech-to-text with automatic language detection (`ai-companion/whisper-service/whisper_api.py`), and GPT handles multilingual responses directly. However, memory embeddings are stored in the original language, causing semantic drift.

**Integration Steps:**

1. **Replace Embedding Model**
   - **Modify**: `ai-companion/embed-service/memory_api.py`
   ```python
   # Replace current model with LaBSE for multilingual support
   model = SentenceTransformer("sentence-transformers/LaBSE")
   
   def store_multilingual_memory(data: StoreInput):
       # Detect language
       detected_language = detect_language(data.content)
       
       # Store with language metadata
       collection.add(
           documents=[data.content],
           metadatas=[{
               "user_id": data.user_id,
               "timestamp": data.timestamp,
               "language": detected_language,
               "content_type": "conversation"
           }],
           ids=[str(uuid4())]
       )
   
   def recall_cross_language_memories(query: RecallInput):
       # Query across all languages for the user
       results = collection.query(
           query_texts=[query.query],
           n_results=query.top_k,
           where={"user_id": query.user_id}
       )
       
       # Apply cross-language similarity scoring
       return results
   ```

2. **Add Language Detection Service**
   - **New File**: `ai-companion/backend/src/main/java/com/example/ai_companion/service/LanguageDetectionService.java`
   ```java
   @Service
   public class LanguageDetectionService {
       
       public String detectLanguage(String text) {
           // Integrate with language detection API
           // Store language metadata with memories
       }
       
       public List<String> getSupportedLanguages() {
           return Arrays.asList("en", "es", "fr", "de", "it", "pt", "zh", "ja", "ko");
       }
   }
   ```

3. **Update LLM Service for Multilingual Context**
   - **Modify**: `ai-companion/backend/src/main/java/com/example/ai_companion/service/LLMService.java`
   ```java
   public String generateAndTrack(String userId, String query, Object location, String logFilename) {
       // Detect user language from query
       String userLanguage = languageDetectionService.detectLanguage(query);
       
       // Retrieve cross-language memories
       List<Memory> memories = memoryService.recallMemoriesCrossLanguage(userId, query);
       
       // Generate response with cultural context awareness
       String response = generateCulturallyAwareResponse(query, memories, userLanguage);
       
       return response;
   }
   ```

4. **Frontend Localization Enhancements**
   - **Modify**: `frontend/src/hooks/useWhisper.ts`
   - Add language preference persistence
   - Implement cultural context adaptation in UI components

### **6.4 Avatar Synchronization and Affective Timing**

**Current Implementation Analysis:**
The system uses HeyGen's task-based API (`ai-companion/backend/src/main/java/com/example/ai_companion/service/HeyGenService.java`) with session management. Latency comes from sequential processing: LLM generation → HeyGen task submission → avatar rendering.

**Integration Steps:**

1. **Optimize HeyGen Service**
   - **Modify**: `ai-companion/backend/src/main/java/com/example/ai_companion/service/HeyGenService.java`
   ```java
   @Service
   public class HeyGenService {
       private final Map<String, SessionPool> sessionPools = new ConcurrentHashMap<>();
       
       public Map<String, Object> sendTaskToHeyGenOptimized(String sessionId, String text, 
                                                          String taskType, String logFilename) {
           // Implement session pooling
           SessionPool pool = sessionPools.computeIfAbsent(sessionId, k -> new SessionPool());
           
           // Parallel processing for common responses
           if (isCommonResponse(text)) {
               return processCommonResponse(text, sessionId);
           }
           
           // Adaptive voice rate based on content type
           double voiceRate = calculateOptimalVoiceRate(text);
           return sendTaskWithOptimizedSettings(sessionId, text, taskType, voiceRate, logFilename);
       }
       
       private double calculateOptimalVoiceRate(String text) {
           // Analyze text for emotional content
           if (containsEmotionalContent(text)) {
               return 0.8; // Slower for emotional content
           } else if (containsUrgentContent(text)) {
               return 1.2; // Faster for urgent content
           }
           return 1.0; // Default rate
       }
   }
   ```

2. **Implement Session Pooling**
   - **New File**: `ai-companion/backend/src/main/java/com/example/ai_companion/service/SessionPoolManager.java`
   ```java
   @Service
   public class SessionPoolManager {
       private final Map<String, List<HeyGenSession>> sessionPools = new ConcurrentHashMap<>();
       
       public HeyGenSession getAvailableSession(String userId) {
           // Return available session or create new one
       }
       
       public void returnSession(String userId, HeyGenSession session) {
           // Return session to pool for reuse
       }
   }
   ```

3. **Frontend Connection State Management**
   - **Modify**: `frontend/src/hooks/useHeyGen.ts`
   ```typescript
   export const useHeyGen = () => {
     const [connectionState, setConnectionState] = useState<'connected' | 'disconnected' | 'reconnecting'>('disconnected');
     
     const sendTaskWithFallback = async (text: string, sessionId: string) => {
       try {
         // Try HeyGen first
         const result = await heyGenService.sendTask(sessionId, text);
         return result;
       } catch (error) {
         // Fallback to local TTS
         return await localTTSService.speak(text);
       }
     };
   };
   ```

### **6.5 Latency Reduction and Parallel Inference**

**Current Implementation Analysis:**
The `LLMService.generateAndTrack()` method processes requests sequentially. The current implementation has ~6 seconds end-to-end latency.

**Integration Steps:**

1. **Implement Parallel Processing**
   - **Modify**: `ai-companion/backend/src/main/java/com/example/ai_companion/service/LLMService.java`
   ```java
   public String generateAndTrack(String userId, String query, Object location, String logFilename) {
       // Parallel memory retrieval and LLM inference
       CompletableFuture<List<Memory>> memoryFuture = CompletableFuture.supplyAsync(() -> 
           memoryService.recallMemories(userId, query));
       
       CompletableFuture<String> llmFuture = CompletableFuture.supplyAsync(() -> 
           generateResponse(query, location));
       
       // Wait for both to complete
       List<Memory> memories = memoryFuture.join();
       String baseResponse = llmFuture.join();
       
       // Combine results
       return enhanceResponseWithMemories(baseResponse, memories);
   }
   ```

2. **Add Response Streaming**
   - **New File**: `ai-companion/backend/src/main/java/com/example/ai_companion/service/StreamingLLMService.java`
   ```java
   @Service
   public class StreamingLLMService {
       
       public void streamResponse(String userId, String query, SseEmitter emitter) {
           // Stream response tokens as they're generated
           chatLanguageModel.generate(query)
               .onNext(token -> {
                   try {
                       emitter.send(token);
                   } catch (IOException e) {
                       emitter.completeWithError(e);
                   }
               })
               .onComplete(() -> emitter.complete())
               .onError(emitter::completeWithError);
       }
   }
   ```

3. **Frontend Progressive Display**
   - **New File**: `frontend/src/components/ProgressiveResponse.tsx`
   ```typescript
   const ProgressiveResponse: React.FC<{ response: string }> = ({ response }) => {
     const [displayedText, setDisplayedText] = useState('');
     
     useEffect(() => {
       // Display response progressively as it streams
       const words = response.split(' ');
       words.forEach((word, index) => {
         setTimeout(() => {
           setDisplayedText(prev => prev + word + ' ');
         }, index * 50); // 50ms delay between words
       });
     }, [response]);
     
     return <Text>{displayedText}</Text>;
   };
   ```

### **6.6 User-Editable Memory Console**

**Integration Steps:**

1. **Create Memory Management Controller**
   - **New File**: `ai-companion/backend/src/main/java/com/example/ai_companion/controller/MemoryManagementController.java`
   ```java
   @RestController
   @RequestMapping("/memory-management")
   public class MemoryManagementController {
       
       @GetMapping("/memories")
       public ResponseEntity<List<Memory>> getUserMemories(@RequestParam String userId) {
           List<Memory> memories = memoryService.getAllUserMemories(userId);
           return ResponseEntity.ok(memories);
       }
       
       @PutMapping("/memories/{memoryId}")
       public ResponseEntity<?> updateMemory(@PathVariable String memoryId, 
                                          @RequestBody MemoryUpdateRequest request) {
           memoryService.updateMemory(memoryId, request.getContent());
           return ResponseEntity.ok().build();
       }
       
       @DeleteMapping("/memories/{memoryId}")
       public ResponseEntity<?> deleteMemory(@PathVariable String memoryId) {
           memoryService.deleteMemory(memoryId);
           return ResponseEntity.ok().build();
       }
   }
   ```

2. **Frontend Memory Dashboard**
   - **New File**: `frontend/src/screens/Caregiver/MemoryDashboard.tsx`
   - **New File**: `frontend/src/components/MemoryEditor.tsx`
   - **New File**: `frontend/src/components/MemorySearch.tsx`

### **Implementation Priority Matrix**

| Feature | Complexity | Impact | Dependencies |
|---------|------------|--------|--------------|
| Memory Governance | High | Critical | Database schema updates |
| Selective Embedding | Medium | High | Embedding service refactor |
| Avatar Optimization | Medium | Medium | HeyGen API updates |
| Latency Reduction | High | High | Full system optimization |
| Memory Console | Low | Medium | UI/UX development |
| Wellbeing Analytics | High | High | ML model integration |
| Hierarchical Memory | Very High | High | Complete architecture redesign |
| Edge Deployment | High | Medium | Infrastructure changes |
| Human Trials | Medium | Critical | Ethical approval process |

### **Development Roadmap**

**Phase 1 (Months 1-3)**: Memory Governance, Memory Console, Basic Analytics
**Phase 2 (Months 4-6)**: Selective Embedding, Avatar Optimization, Latency Reduction
**Phase 3 (Months 7-9)**: Hierarchical Memory, Edge Deployment, Human Trials
**Phase 4 (Months 10-12)**: Full Integration, Performance Optimization, Production Deployment

---

## Individual Contributions

*This section will be updated to include individual student submissions and contributions as they are added to the compendium.*

### **Andy Lee Contributions**
- [To be added]

### **Andrew Shin Contributions**
- [To be added]


---

## Research Materials

### **System Architecture Documentation**
- **Database Schema**: `diagrams/database.pdf` - Complete MongoDB schema with relationships
- **System Architecture**: `diagrams/projectArchitecture.pdf` - Component interactions and data flow
- **API Documentation**: Comprehensive endpoint specifications with examples

### **Experimental Data**
- **User Interaction Logs**: Detailed conversation logs with performance metrics
- **Performance Benchmarks**: System response times and accuracy measurements
- **Memory Retrieval Data**: Semantic search accuracy and relevance scores
- **Avatar Performance**: HeyGen integration metrics and sync analysis

### **Evaluation Results**
- **User Experience Testing**: Elderly user interaction patterns and preferences
- **Caregiver Feedback**: Dashboard usability and oversight effectiveness
- **System Performance**: Latency analysis and optimization opportunities
- **Accessibility Assessment**: UI/UX evaluation for elderly users

---

## Getting Started

For detailed setup instructions, prerequisites, and deployment information, please refer to the comprehensive README in the `project24-aicompanion/` directory.

### **Quick Start**
1. **Prerequisites**: macOS, Xcode, Node.js 18+, Docker Desktop, Java 21
2. **Clone Repository**: `git clone [repository-url]`
3. **Setup Environment**: 
   ```bash
   cd project24-aicompanion
   cp .env.example .env
   # Edit .env with your API keys
   ```
4. **Run Setup Script**: `./scripts/start-ios-dev.sh`
5. **Access Application**: iOS Simulator or Android Emulator

### **Development Environment**
- **Backend**: Spring Boot on port 8080
- **Embedding Service**: FastAPI on port 8000
- **Whisper Service**: FastAPI on port 8001
- **Database**: MongoDB on port 27017
- **Frontend**: React Native with Expo

### **Configuration**
- **Environment Variables**: Set API keys in `.env` files
- **Database**: MongoDB with user collections and memory storage
- **AI Services**: OpenAI GPT-4o-mini, HeyGen streaming, Whisper transcription

---

## 📞 Contact Information

For questions about this research compendium or the Project 24 implementation, please refer to the individual component documentation or contact the research team.

---

**Note:** This compendium is designed to support academic research and enable replication of the Project 24 AI-enabled virtual assistant system. All materials are provided for educational and research purposes.