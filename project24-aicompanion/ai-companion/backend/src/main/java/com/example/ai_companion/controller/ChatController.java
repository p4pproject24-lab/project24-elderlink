package com.example.ai_companion.controller;

import com.example.ai_companion.model.Message;
import com.example.ai_companion.model.User;
import com.example.ai_companion.repository.MessageRepository;
import com.example.ai_companion.repository.UserRepository;
import com.example.ai_companion.service.LLMService;
import com.example.ai_companion.service.MemoryService;
import com.example.ai_companion.service.HeyGenService;
import com.example.ai_companion.service.ReminderService;
import com.example.ai_companion.service.GameService;
import com.example.ai_companion.utils.ApiResponseBuilder;
import com.example.ai_companion.utils.logger;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Controller for handling chat-related actions, including asking questions,
 * introducing users, retrieving chat history, and deleting messages.
 */
@RestController
@RequestMapping("/memory")
public class ChatController {

    @Autowired
    private MemoryService memoryService;

    @Autowired 
    private LLMService llmService;

    @Autowired
    private MessageRepository messageRepository;

    @Autowired
    private HeyGenService heyGenService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ReminderService reminderService;

    @Autowired
    private GameService gameService;

    private static final java.util.concurrent.ExecutorService executor = java.util.concurrent.Executors.newFixedThreadPool(8);

    /**
     * Handles a new user question and returns the assistant's response.
     *
     * @param userId   The ID of the user sending the question.
     * @param payload  The user's message and optional location info.
     * @return The assistant's response as a plain string.
     */
    @PostMapping("/ask")
    public String ask(@RequestParam String userId, @RequestBody Map<String, Object> payload) {
        String message = (String) payload.get("message");
        // location optional in payload; not used currently
        Object location = payload.get("location");
        logger.logToFile(userId, "new question");
        
        String aiResponse = llmService.generateAndTrack(userId, message, location);
        
        // Async reminder extraction from user message
        executor.submit(() -> {
            try {
                reminderService.extractReminders(userId, message);
                logger.logToFile(userId, "Reminder extraction completed for: " + message);
            } catch (Exception e) {
                logger.logToFile(userId, "Error extracting reminders: " + e.getMessage());
            }
        });
        
        return aiResponse;
    }

    /**
     * Handles a new user question and returns both the AI text and avatar audio response.
     *
     * @param userId   The ID of the user sending the question.
     * @param payload  The user's message, sessionId, and optional location info.
     * @return ApiResponse with AI text and HeyGen audio response.
     */
    @PostMapping("/ask-avatar")
    public ResponseEntity<?> askAvatar(@RequestParam String userId, @RequestBody Map<String, Object> payload) {
        double overallStart = System.currentTimeMillis() / 1000.0;
        String message = (String) payload.get("message");
        String sessionId = (String) payload.get("sessionId");

        // Log file: timestamp + userId
        String logFilename = String.format("msg_%d_%s.txt", (long)(overallStart * 1000), userId);
        logger.logToFile(logFilename, String.format("[START] ask-avatar for userId=%s at %.3f", userId, overallStart));
        logger.logToFile(logFilename, String.format("Received message: '%s'", message));

        // Step 1: LLM
        double llmStart = System.currentTimeMillis() / 1000.0;
        logger.logToFile(logFilename, String.format("[LLM] Start at %.3f", llmStart));
        String aiText = llmService.generateAndTrack(userId, message, null, logFilename);
        double llmEnd = System.currentTimeMillis() / 1000.0;
        logger.logToFile(logFilename, String.format("[LLM] End at %.3f (duration: %.2f s)", llmEnd, (llmEnd-llmStart)));

        // Step 2: Avatar
        double avatarStart = System.currentTimeMillis() / 1000.0;
        logger.logToFile(logFilename, String.format("[Avatar] Start at %.3f", avatarStart));
        Map<String, Object> taskResult = heyGenService.sendTaskToHeyGen(sessionId, aiText, "repeat", logFilename);
        double avatarEnd = System.currentTimeMillis() / 1000.0;
        logger.logToFile(logFilename, String.format("[Avatar] End at %.3f (duration: %.2f s)", avatarEnd, (avatarEnd-avatarStart)));

        // Step 3: Async non-blocking work (after HeyGen)
        executor.submit(() -> {
            double asyncStart = System.currentTimeMillis() / 1000.0;
            memoryService.extractAndStoreInsights(userId, message, aiText);
            double asyncEnd = System.currentTimeMillis() / 1000.0;
            logger.logToFile(logFilename, "Memory insight extraction (async): " + String.format("%.2f s", (asyncEnd - asyncStart)));
        });
        executor.submit(() -> {
            double asyncStart = System.currentTimeMillis() / 1000.0;
            messageRepository.save(new Message(userId, message, true, java.time.Instant.now()));
            messageRepository.save(new Message(userId, aiText, false, java.time.Instant.now()));
            double asyncEnd = System.currentTimeMillis() / 1000.0;
            logger.logToFile(logFilename, "Message saving (async): " + String.format("%.2f s", (asyncEnd - asyncStart)));
        });
        executor.submit(() -> {
            double asyncStart = System.currentTimeMillis() / 1000.0;
            try {
                reminderService.extractReminders(userId, message);
                double asyncEnd = System.currentTimeMillis() / 1000.0;
                logger.logToFile(logFilename, "Reminder extraction (async): " + String.format("%.2f s", (asyncEnd - asyncStart)));
            } catch (Exception e) {
                double asyncEnd = System.currentTimeMillis() / 1000.0;
                logger.logToFile(logFilename, "Error extracting reminders (async): " + e.getMessage() + " " + String.format("%.2f s", (asyncEnd - asyncStart)));
            }
        });
        executor.submit(() -> {
            double asyncStart = System.currentTimeMillis() / 1000.0;
            memoryService.extractAndStoreInsights(userId, message, aiText);
            double asyncEnd = System.currentTimeMillis() / 1000.0;
            logger.logToFile(logFilename, "Memory insight extraction (async): " + String.format("%.2f s", (asyncEnd - asyncStart)));
        });

        // Step 4: Total
        double overallEnd = System.currentTimeMillis() / 1000.0;
        logger.logToFile(logFilename, String.format("[END] ask-avatar for userId=%s at %.3f (total duration: %.2f s)", userId, overallEnd, (overallEnd-overallStart)));

        Map<String, Object> result = new HashMap<>();
        result.put("text", aiText);
        result.put("duration_ms", taskResult.get("duration_ms"));
        result.put("task_id", taskResult.get("task_id"));
        return ApiResponseBuilder.build(org.springframework.http.HttpStatus.OK, "AI and avatar response", result);
    }

    /**
     * Generates an AI-only message to initiate or resume conversation without creating a user message.
     * If user has no prior messages, generates a short warm greeting and invitation to talk.
     * If user has prior messages, generates a brief resume/continuation line and prompt to continue.
     * Then sends the text to HeyGen for audio, and stores ONLY the assistant message in history.
     */
    @PostMapping("/ask-auto-avatar")
    public ResponseEntity<?> askAutoAvatar(@RequestParam String userId, @RequestBody Map<String, Object> payload) {
        double overallStart = System.currentTimeMillis() / 1000.0;
        String sessionId = (String) payload.get("sessionId");
        Object location = payload.get("location");

        String logFilename = String.format("auto_msg_%d_%s.txt", (long)(overallStart * 1000), userId);
        logger.logToFile(logFilename, String.format("[START] ask-auto-avatar for userId=%s at %.3f", userId, overallStart));

        // Determine if first-time or returning user (always provide proper greeting on app re-entry)
        List<com.example.ai_companion.model.Message> recent = messageRepository.findTop10ByUserIdOrderByTimestampDesc(userId);
        boolean isFirst = recent == null || recent.isEmpty();
        
        // Get user profile for personalized greeting
        com.example.ai_companion.model.User user = userRepository.findByFirebaseUid(userId);
        String name = user != null && user.getFullName() != null ? user.getFullName() : "there";
        String coreInfo = user != null && user.getCoreInformation() != null ? user.getCoreInformation() : "";

        // Build prompt - always provide proper greeting and context
        String prompt;
        if (isFirst) {
            // Personalized first greeting using user profile
            prompt = ("You are a warm, friendly AI companion for elderly care. " +
                    "Greet the user by name (" + name + ") in a short, gentle way (1-2 sentences). " +
                    "Offer help and invite them to speak. " +
                    "End your message by reassuring them that you're always here to help. " +
                    "Keep it natural and encouraging. " +
                    (coreInfo.isEmpty() ? "" : ("Consider this profile note: " + coreInfo + ". ")) +
                    "Do not ask multiple questions; one simple invitation is enough. No emojis.");
        } else {
            // Returning user - always provide proper greeting with context from last conversation
            StringBuilder context = new StringBuilder();
            recent.stream()
                  .sorted((a, b) -> a.getTimestamp().compareTo(b.getTimestamp()))
                  .forEach(m -> context.append(m.isFromUser() ? "User: " : "Assistant: ")
                                       .append(m.getText()).append("\n"));
            
            // Calculate time since last message for time-aware greeting
            com.example.ai_companion.model.Message lastMessage = recent.get(0);
            long minutesSinceLastMessage = java.time.Duration.between(
                lastMessage.getTimestamp(), 
                java.time.Instant.now()
            ).toMinutes();
            
            String timeContext;
            if (minutesSinceLastMessage < 60) {
                timeContext = "just a few minutes ago";
            } else if (minutesSinceLastMessage < 1440) { // less than 24 hours
                long hours = minutesSinceLastMessage / 60;
                timeContext = hours == 1 ? "about an hour ago" : "a few hours ago";
            } else {
                long days = minutesSinceLastMessage / 1440;
                timeContext = days == 1 ? "yesterday" : days + " days ago";
            }
            
            prompt = ("You are a warm, friendly AI companion for elderly care. " +
                    "The user is returning to the app. Greet them warmly by name (" + name + ") and ask how they're doing. " +
                    "Reference something from their last conversation to show you remember and care, using the appropriate time reference. " +
                    "The following are the last few messages from their previous conversation (most recent last):\n" +
                    context.toString() +
                    "\nThe last conversation was " + timeContext + ". " +
                    "Use phrases like 'I remember you were talking about...' or 'How did that go with...' to reference their last topic with the correct time context. " +
                    "Then ask how they're doing and what you can help with. " +
                    "End your message by reassuring them that you're always here to help. " +
                    "Keep it warm and personal (2-3 sentences). " +
                    (coreInfo.isEmpty() ? "" : ("Consider this profile note: " + coreInfo + ". ")) +
                    "No emojis.");
        }

        // Generate text
        double llmStart = System.currentTimeMillis() / 1000.0;
        logger.logToFile(logFilename, String.format("[Auto LLM] Start at %.3f", llmStart));
        String aiText = llmService.generateResponse(prompt);
        double llmEnd = System.currentTimeMillis() / 1000.0;
        logger.logToFile(logFilename, String.format("[Auto LLM] End at %.3f (duration: %.2f s)", llmEnd, (llmEnd-llmStart)));

        // Store assistant message only
        messageRepository.save(new com.example.ai_companion.model.Message(userId, aiText, false, java.time.Instant.now()));

        // Send to HeyGen
        double avatarStart = System.currentTimeMillis() / 1000.0;
        logger.logToFile(logFilename, String.format("[Avatar] Start at %.3f", avatarStart));
        Map<String, Object> taskResult = heyGenService.sendTaskToHeyGen(sessionId, aiText, "repeat", logFilename);
        double avatarEnd = System.currentTimeMillis() / 1000.0;
        logger.logToFile(logFilename, String.format("[Avatar] End at %.3f (duration: %.2f s)", avatarEnd, (avatarEnd-avatarStart)));

        double overallEnd = System.currentTimeMillis() / 1000.0;
        logger.logToFile(logFilename, String.format("[END] ask-auto-avatar for userId=%s at %.3f (total duration: %.2f s)", userId, overallEnd, (overallEnd-overallStart)));

        Map<String, Object> result = new HashMap<>();
        result.put("text", aiText);
        result.put("duration_ms", taskResult.get("duration_ms"));
        result.put("task_id", taskResult.get("task_id"));
        return ApiResponseBuilder.build(org.springframework.http.HttpStatus.OK, "AI auto and avatar response", result);
    }

    /**
     * Handles a game message and returns both the AI text and avatar audio response.
     *
     * @param userId   The ID of the user sending the message.
     * @param payload  The user's message, game session ID, session ID, and optional location info.
     * @return ApiResponse with AI text and HeyGen audio response.
     */
    @PostMapping("/ask-game-avatar")
    public ResponseEntity<?> askGameAvatar(@RequestParam String userId, @RequestBody Map<String, Object> payload) {
        double overallStart = System.currentTimeMillis() / 1000.0;
        String message = (String) payload.get("message");
        String gameSessionId = (String) payload.get("gameSessionId");
        String sessionId = (String) payload.get("sessionId");

        // Log file: timestamp + userId
        String logFilename = String.format("game_msg_%d_%s.txt", (long)(overallStart * 1000), userId);
        logger.logToFile(logFilename, String.format("[START] ask-game-avatar for userId=%s at %.3f", userId, overallStart));
        logger.logToFile(logFilename, String.format("Received message: '%s', gameSessionId: '%s'", message, gameSessionId));

        // Step 1: Game LLM Processing
        double gameStart = System.currentTimeMillis() / 1000.0;
        logger.logToFile(logFilename, String.format("[Game LLM] Start at %.3f", gameStart));
        String gameResponse = gameService.processGameMessage(gameSessionId, userId, message);
        double gameEnd = System.currentTimeMillis() / 1000.0;
        logger.logToFile(logFilename, String.format("[Game LLM] End at %.3f (duration: %.2f s)", gameEnd, (gameEnd-gameStart)));

        // Step 2: Avatar
        double avatarStart = System.currentTimeMillis() / 1000.0;
        logger.logToFile(logFilename, String.format("[Avatar] Start at %.3f", avatarStart));
        Map<String, Object> taskResult = heyGenService.sendTaskToHeyGen(sessionId, gameResponse, "repeat", logFilename);
        double avatarEnd = System.currentTimeMillis() / 1000.0;
        logger.logToFile(logFilename, String.format("[Avatar] End at %.3f (duration: %.2f s)", avatarEnd, (avatarEnd-avatarStart)));

        // Step 3: Total
        double overallEnd = System.currentTimeMillis() / 1000.0;
        logger.logToFile(logFilename, String.format("[END] ask-game-avatar for userId=%s at %.3f (total duration: %.2f s)", userId, overallEnd, (overallEnd-overallStart)));

        Map<String, Object> result = new HashMap<>();
        result.put("text", gameResponse);
        result.put("duration_ms", taskResult.get("duration_ms"));
        result.put("task_id", taskResult.get("task_id"));
        return ApiResponseBuilder.build(org.springframework.http.HttpStatus.OK, "AI game and avatar response", result);
    }

    /**
     * Stores introductory information provided by the user and generates a personalized AI welcome message.
     * This creates the first AI message that will appear in the chat history.
     *
     * @param userId    The ID of the user.
     * @param introText The introduction text provided by the user.
     * @return A confirmation message or an error status.
     */
    @PostMapping("/introduce")
    public ResponseEntity<String> introduce(@RequestParam String userId, @RequestBody String introText) {
        try {
            logger.logToFile(userId, "Received introduction request with userId: " + userId);
            // Use Firebase UID to find user instead of MongoDB ID
            User user = userRepository.findByFirebaseUid(userId);
            if (user == null) {
                logger.logToFile(userId, "User not found with Firebase UID: " + userId);
                return ResponseEntity.status(404).body("User not found. Introduction not saved.");
            }
            
            logger.logToFile(userId, "Found user: " + user.getFullName() + " (ID: " + user.getId() + ", FirebaseUID: " + user.getFirebaseUid() + ")");

            // Generate personalized AI welcome message using LLM
            String aiWelcomeMessage = generatePersonalizedWelcomeMessage(user, introText);
            
            // Only store the AI's welcome message as the first message (use Firebase UID)
            Message aiMessage = new Message(user.getFirebaseUid(), aiWelcomeMessage, false, Instant.now());
            messageRepository.save(aiMessage);
            
            // Store insights in memory service (use Firebase UID)
            memoryService.extractAndStoreInsights(user.getFirebaseUid(), introText, aiWelcomeMessage);

            logger.logToFile(userId, "AI welcome message stored successfully");
            return ResponseEntity.ok("AI welcome message generated and stored.");
            
        } catch (Exception e) {
            logger.logToFile(userId, "Error during introduction: " + e.getMessage());
            return ResponseEntity.status(500).body("Internal error during introduction: " + e.getMessage());
        }
    }

    /**
     * Generates a personalized welcome message for the user based on their profile information.
     */
    private String generatePersonalizedWelcomeMessage(User user, String introText) {
        StringBuilder prompt = new StringBuilder();
        prompt.append("You are a warm, friendly AI companion designed specifically for elderly care. ");
        prompt.append("You're meeting a new elderly user for the first time after they've completed their profile setup. ");
        prompt.append("Generate a personalized welcome message that incorporates their information.\n\n");
        
        prompt.append("USER PROFILE INFORMATION:\n");
        if (user.getFullName() != null && !user.getFullName().trim().isEmpty()) {
            String firstName = user.getFullName().split(" ")[0];
            prompt.append("- Name: ").append(user.getFullName()).append(" (call them ").append(firstName).append(")\n");
        }
        if (user.getAddress() != null && !user.getAddress().trim().isEmpty()) {
            prompt.append("- Location: ").append(user.getAddress()).append("\n");
        }
        if (user.getDateOfBirth() != null && !user.getDateOfBirth().trim().isEmpty()) {
            prompt.append("- Date of Birth: ").append(user.getDateOfBirth()).append("\n");
        }
        if (user.getCoreInformation() != null && !user.getCoreInformation().trim().isEmpty()) {
            prompt.append("- Core Information: ").append(user.getCoreInformation()).append("\n");
        }
        
        prompt.append("\nUSER'S INTRODUCTION:\n").append(introText).append("\n\n");
        
        prompt.append("Create a warm, personalized welcome message that:\n");
        prompt.append("• Uses their first name naturally\n");
        prompt.append("• References their location if available\n");
        prompt.append("• Incorporates their core information (daily life, relationships, medical needs, hobbies)\n");
        prompt.append("• Explains your role as their AI companion\n");
        prompt.append("• Mentions key features you can help with (daily check-ins, reminders, brain games, chat)\n");
        prompt.append("• Shows empathy and understanding for elderly users\n");
        prompt.append("• Uses clear, simple language suitable for older adults\n");
        prompt.append("• Maintains a warm, friendly, and supportive tone\n");
        prompt.append("• Avoids technical jargon\n");
        prompt.append("• Does not use emojis\n");
        prompt.append("• Keeps the message welcoming but concise (2-3 sentences)\n\n");
        
        prompt.append("Respond with a natural, conversational welcome message that makes the user feel comfortable and supported.");

        return llmService.generateResponse(prompt.toString());
    }

    /**
     * Retrieves the 30 most recent messages for the given user, with pagination support.
     *
     * @param userId The ID of the user.
     * @param page   The page number to retrieve (default is 0).
     * @return A list of the user's recent messages, ordered from oldest to newest.
     */
    @GetMapping("/chats")
    public ResponseEntity<List<Message>> getChats(
            @RequestParam String userId,
            @RequestParam(required = false, defaultValue = "0") int page) {

        PageRequest pageRequest = PageRequest.of(page, 30, Sort.by(Sort.Direction.DESC, "timestamp"));
        List<Message> recentMessages = messageRepository.findByUserId(userId, pageRequest);

        // Reverse the list to return in chronological order (oldest → newest)
        Collections.reverse(recentMessages);

        return ResponseEntity.ok(recentMessages);
    }

    /**
     * Deletes a message by its ID.
     *
     * @param id The ID of the message to delete.
     * @return HTTP 204 if successful, or HTTP 404 if the message does not exist.
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteMessage(@PathVariable String id) {
        if (!messageRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        messageRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}