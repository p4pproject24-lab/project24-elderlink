package com.example.ai_companion.service;

import com.example.ai_companion.model.GameMessage;
import com.example.ai_companion.model.GameSession;
import com.example.ai_companion.model.User;
import com.example.ai_companion.repository.GameMessageRepository;
import com.example.ai_companion.repository.GameSessionRepository;
import com.example.ai_companion.repository.UserRepository;
import com.example.ai_companion.utils.logger;
import dev.langchain4j.model.chat.ChatLanguageModel;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Service for managing cognitive game sessions and interactions.
 */
@Service
public class GameService {

    @Autowired
    private ChatLanguageModel gemini;

    @Autowired
    private GameSessionRepository gameSessionRepository;

    @Autowired
    private GameMessageRepository gameMessageRepository;

    @Autowired
    private UserRepository userRepository;

    /**
     * Generates a game preview without creating a session.
     */
    public Map<String, String> generateGamePreview(String userId) {
        // Get user profile for personalized games
        User user = userRepository.findById(userId).orElse(null);
        String userProfile = (user != null && user.getCoreInformation() != null) ? user.getCoreInformation() : "";
        
                String prompt = """
            You are a game designer creating diverse cognitive games for elderly users. 
            IMPORTANT: Avoid memory/storytelling games. Create something completely different each time.

            User Profile: %s

            CRITICAL: Choose a RANDOM category from this list (don't always pick the first few):
            1. Logic & Problem-Solving Games
            2. Pattern Recognition & Sequences  
            3. Spatial & Visual Thinking
            4. Language & Word Games
            5. Music & Rhythm Activities
            6. Art & Creative Expression
            7. Science & Nature Discovery
            8. Cultural & Historical Games
            9. Mathematics & Numbers
            10. Decision Making & Strategy
            11. Observation & Attention Games
            12. Adventure & Exploration
            13. Mystery & Detective Games
            14. Community & Social Games
            15. Fantasy & Imagination (but NOT memory-based)
            16. Sensory & Observation Games
            17. Creative Problem-Solving
            18. Pattern Matching & Sequences
            19. Visual Puzzle Games
            20. Interactive Learning Games

            Game Requirements:
            - Choose a DIFFERENT category than memory/storytelling
            - Keep description short (2-3 sentences max)
            - Make it interactive and conversation-based
            - Accessible for elderly users
            - Mentally stimulating but not overwhelming

            Examples of NON-memory games:
            - "Pattern Detective": Find hidden patterns in sequences
            - "Logic Labyrinth": Solve puzzles through conversation
            - "Visual Symphony": Create art through description
            - "Rhythm Master": Create musical patterns with words
            - "Science Explorer": Discover scientific concepts through questions
            - "Cultural Detective": Learn about different cultures through clues
            - "Number Navigator": Solve mathematical puzzles and sequences
            - "Strategy Builder": Plan and execute simple strategies
            - "Attention Tracker": Find hidden objects or patterns
            - "Adventure Navigator": Navigate imaginary worlds
            - "Mystery Solver": Solve puzzles and riddles
            - "Community Builder": Strengthen social connections
            - "Fantasy Architect": Build imaginary worlds (not memory-based)
            - "Sensory Detective": Use senses to solve mysteries
            - "Creative Problem Solver": Solve unique challenges
            - "Pattern Matcher": Find and create patterns
            - "Visual Puzzle Master": Solve visual puzzles through description
            - "Interactive Learner": Learn new concepts through play
            - "Logic Chain": Build logical sequences
            - "Strategy Planner": Plan and execute strategies

            AVOID: Memory games, storytelling games, reminiscing activities, personal history games, emotion/empathy games, mindfulness activities

            Return ONLY a JSON object:
            {
                "title": "Creative Game Title",
                "description": "Brief description (2-3 sentences max)"
            }
            """.formatted(userProfile);

        String response = gemini.chat(prompt);
        String title = extractJsonValue(response, "title");
        String description = extractJsonValue(response, "description");

        Map<String, String> preview = new HashMap<>();
        preview.put("title", title);
        preview.put("description", description);
        
        return preview;
    }

    /**
     * Creates a new game session based on user input.
     */
    public GameSession createGameSession(String userId, String gameType, String userDescription) {
        User user = userRepository.findById(userId).orElse(null);
        String coreInfo = (user != null && user.getCoreInformation() != null) ? user.getCoreInformation() : "none";

        String title;
        String description;

        if ("generated".equals(gameType)) {
            // Check if userDescription contains preview data (format: "Title: Description")
            if (userDescription != null && !userDescription.trim().isEmpty() && userDescription.contains(":")) {
                // Extract title and description from the preview data
                String[] parts = userDescription.split(":", 2);
                title = parts[0].trim();
                description = parts[1].trim();
            } else {
                // Generate a game based on user profile (fallback)
                String prompt = """
                    You are a cognitive game master. Create a fun, engaging game for an elderly user.
                    
                    User Profile: %s
                    
                    Generate a game that is:
                    - Mentally stimulating but not overwhelming
                    - Fun and engaging
                    - Appropriate for elderly users
                    - Can be played through conversation

                    Return ONLY a JSON object with:
                    {
                        "title": "Game Title",
                        "description": "Brief description of the game"
                    }
                    """.formatted(coreInfo);

                String response = gemini.chat(prompt);
                // Simple JSON parsing (in production, use proper JSON library)
                title = extractJsonValue(response, "title");
                description = extractJsonValue(response, "description");
            }
        } else {
            // Custom game based on user description
            String prompt = """
                You are a cognitive game master. Create a game based on the user's description.
                
                User Description: %s
                User Profile: %s
                
                Generate a game that matches their request while being:
                - Mentally stimulating
                - Fun and engaging
                - Appropriate for elderly users
                - Can be played through conversation

                Return ONLY a JSON object with:
                {
                    "title": "Game Title",
                    "description": "Brief description of the game"
                }
                """.formatted(userDescription, coreInfo);

            String response = gemini.chat(prompt);
            title = extractJsonValue(response, "title");
            description = extractJsonValue(response, "description");
        }

        GameSession gameSession = new GameSession(userId, title, description, gameType, userDescription);
        gameSession = gameSessionRepository.save(gameSession);
        
        // Create an initial AI message to start the game
        String initialMessage = generateInitialGameMessage(gameSession);
        GameMessage aiMessage = new GameMessage(gameSession.getId(), userId, initialMessage, false, Instant.now());
        gameMessageRepository.save(aiMessage);
        
        return gameSession;
    }

    /**
     * Handles a user message in a game session and returns AI response.
     */
    public String processGameMessage(String gameSessionId, String userId, String message) {
        GameSession gameSession = gameSessionRepository.findById(gameSessionId).orElse(null);
        if (gameSession == null) {
            return "Game session not found.";
        }

        User user = userRepository.findById(userId).orElse(null);
        String coreInfo = (user != null && user.getCoreInformation() != null) ? user.getCoreInformation() : "none";

        // Get recent game messages for context
        List<GameMessage> recentMessages = gameMessageRepository.findTop10ByGameSessionIdOrderByTimestampDesc(gameSessionId);
        StringBuilder context = new StringBuilder();
        for (GameMessage gameMessage : recentMessages) {
            if (gameMessage.isFromUser()) {
                context.append("User: ").append(gameMessage.getText()).append("\n");
            } else {
                context.append("Assistant: ").append(gameMessage.getText()).append("\n");
            }
        }

        String prompt = """
            You are an AI-powered Cognitive Game Master hosting a game called "%s".
            
            Game Description: %s
            Game Type: %s
            
            Your role is to:
            - Keep the game engaging and fun
            - Provide appropriate challenges
            - Give encouraging feedback
            - Adapt difficulty based on user responses
            - Keep responses conversational and warm
            
            User Profile: %s
            
            Recent Game Context:
            %s
            
            User's Latest Message: "%s"
            
            Respond as the game master, continuing the game naturally. Keep your response engaging and game-focused.
            """.formatted(
                gameSession.getTitle(),
                gameSession.getDescription(),
                gameSession.getGameType(),
                coreInfo,
                context.toString(),
                message
            );

        String response = gemini.chat(prompt);
        logger.logToFile(userId, "Game Prompt: " + prompt);
        logger.logToFile(userId, "Game Response: " + response);

        // Save messages
        GameMessage userMessage = new GameMessage(gameSessionId, userId, message, true, Instant.now());
        GameMessage assistantMessage = new GameMessage(gameSessionId, userId, response, false, Instant.now());

        gameMessageRepository.save(userMessage);
        gameMessageRepository.save(assistantMessage);

        // Update session activity
        gameSession.setLastActivityAt(Instant.now());
        gameSessionRepository.save(gameSession);

        return response;
    }

    /**
     * Gets game messages for a session with pagination.
     */
    public List<GameMessage> getGameMessages(String gameSessionId, int page, int size) {
        return gameMessageRepository.findByGameSessionIdOrderByTimestampAsc(gameSessionId);
    }

    /**
     * Generates an initial message to start the game.
     */
    private String generateInitialGameMessage(GameSession gameSession) {
        String prompt = """
            You are starting a new cognitive game called "%s".
            
            Game Description: %s
            Game Type: %s
            
            Create an engaging opening message that:
            - Welcomes the user warmly
            - Explains the game in an exciting way
            - Gives clear instructions on how to play
            - Invites the user to start participating
            - Sets a positive, encouraging tone
            - Is conversational and friendly
            
            Keep the message concise but engaging (2-3 sentences maximum).
            Don't ask multiple questions - just one clear invitation to start.
            
            Example tone: "Welcome to [Game Name]! I'm excited to play this [description] with you. [Simple instruction]. Let's begin!"
            """.formatted(
                gameSession.getTitle(),
                gameSession.getDescription(),
                gameSession.getGameType()
            );

        String response = gemini.chat(prompt);
        logger.logToFile(gameSession.getUserId(), "Initial Game Message Prompt: " + prompt);
        logger.logToFile(gameSession.getUserId(), "Initial Game Message Response: " + response);
        
        return response;
    }

    /**
     * Gets all game sessions for a user.
     */
    public List<GameSession> getUserGameSessions(String userId) {
        return gameSessionRepository.findByUserIdOrderByLastActivityAtDesc(userId);
    }

    /**
     * Gets a specific game session.
     */
    public GameSession getGameSession(String gameSessionId) {
        return gameSessionRepository.findById(gameSessionId).orElse(null);
    }

    /**
     * Deletes a game session and all its messages.
     */
    public void deleteGameSession(String gameSessionId) {
        // Delete all messages first
        List<GameMessage> messages = gameMessageRepository.findByGameSessionIdOrderByTimestampAsc(gameSessionId);
        gameMessageRepository.deleteAll(messages);
        
        // Delete the session
        gameSessionRepository.deleteById(gameSessionId);
    }

    /**
     * Simple JSON value extraction (for demo purposes).
     */
    private String extractJsonValue(String json, String key) {
        try {
            String pattern = "\"" + key + "\":\\s*\"([^\"]+)\"";
            java.util.regex.Pattern p = java.util.regex.Pattern.compile(pattern);
            java.util.regex.Matcher m = p.matcher(json);
            if (m.find()) {
                return m.group(1);
            }
        } catch (Exception e) {
            logger.logToFile("system", "Error extracting JSON value: " + e.getMessage());
        }
        return "Cognitive Game"; // Fallback
    }
} 