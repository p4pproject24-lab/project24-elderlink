# AI Companion Backend

A Spring Boot backend application for an AI companion system designed for elderly users and their caregivers.

## Prerequisites

- Java 21
- Maven 3.6+
- MongoDB (for data persistence)

## Running the Application

```bash
# Install dependencies and compile
mvn clean install

# Run the application
mvn spring-boot:run
```

The application will start on `http://localhost:8080`

## Testing

### Running Tests

```bash
# Run all tests
mvn test

# Run tests with coverage report
mvn clean test jacoco:report

# Run specific test classes
mvn test -Dtest=UserControllerTest
mvn test -Dtest="*ServiceTest"
```

### Test Coverage

The project uses JaCoCo for code coverage reporting with the following configuration:

- **Minimum Coverage**: 80%
- **Current Coverage**: 82% overall
- **Controller Coverage**: 95%
- **Service Coverage**: 76%

### Coverage Report

After running tests, view the coverage report at:
```
target/site/jacoco/index.html
```

### Excluded Packages

The following packages are excluded from coverage reporting (as they don't require unit testing):
- `**/config/**` - Configuration classes
- `**/dto/**` - Data Transfer Objects  
- `**/response/**` - Response classes
- `**/utils/**` - Utility classes
- `**/model/**` - Model/Entity classes
- `**/repository/**` - Repository interfaces
- `**/security/**` - Security classes
- `**/exception/**` - Exception handling classes

### Test Structure

- **Controller Tests**: 11 controllers with comprehensive API endpoint testing
- **Service Tests**: 11 services with business logic testing
- **Total Tests**: 413 tests covering edge cases, error handling, and business logic

## API Examples

### User Registration
```bash
curl -X POST http://localhost:8080/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "margaret79",
    "password": "securePassword123"
}'
```

### Memory Introduction
```bash
curl -X POST "http://localhost:8080/memory/introduce?userId=6816ef4f17ffda7deab60726" \
  -H "Content-Type: text/plain" \
  -d "Hello, my name is Margaret Thompson. I'm 79 years old and live alone in Christchurch, New Zealand. I'm a retired nurse who spent over 40 years caring for patients in both hospitals and aged-care facilities. I have two children—Simon, who lives in Wellington and works as an engineer, and Lucy, a primary school teacher in Dunedin.

Since retiring, I've developed a deep love for gardening, especially growing native plants and herbs. I also enjoy knitting warm clothes for local charities and spending quiet afternoons with my golden retriever, Bella. Bella has been my loyal companion for the past 8 years and helps me stay active with our daily walks around the neighbourhood.

My health is mostly stable, but I take medication for mild arthritis and high blood pressure. I occasionally feel lonely, especially on rainy days when I can't go out. I value meaningful conversation, light humour, and reminders for my daily tasks or medications. I'm not very tech-savvy, so I prefer when things are explained simply.

I'm looking forward to using this AI assistant to keep track of things, get helpful suggestions, and maybe even share a few stories along the way."
```

### Memory Query
```bash
curl -X POST "http://localhost:8080/memory/ask?userId=6816ef4f17ffda7deab60726" \
  -H "Content-Type: text/plain" \
  -d "What do you know about me?"
```

## Features

- **AI Integration**: LangChain LLM integration for intelligent responses
- **Memory System**: Persistent memory storage and retrieval
- **User Management**: Firebase authentication and user profiles
- **Caregiver Connections**: Elderly-caregiver relationship management
- **Real-time Communication**: WebSocket support for live interactions
- **Avatar Streaming**: HeyGen integration for AI avatar responses
- **Weather Integration**: Location-based weather information
- **Reminder System**: AI-powered reminder extraction and management
- **Cognitive Games**: Interactive games for mental stimulation
- **Daily Summaries**: AI-generated daily activity summaries

## Technology Stack

- **Framework**: Spring Boot 3.4.5
- **Database**: MongoDB
- **Authentication**: Firebase Admin SDK
- **AI/LLM**: LangChain4j with OpenAI integration
- **Real-time**: WebSocket with STOMP
- **Testing**: JUnit 5, Mockito, JaCoCo
- **Build Tool**: Maven
- **Java Version**: 21