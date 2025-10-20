package com.example.ai_companion.service;

import com.example.ai_companion.model.User;
import com.example.ai_companion.repository.UserRepository;
import com.example.ai_companion.utils.logger;
import dev.langchain4j.model.chat.ChatLanguageModel;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

/**
 * Service responsible for extracting and persisting insights from user interactions.
 * Includes core identity facts and short-term contextual memories.
 */
@Service
public class MemoryService {

    @Autowired private UserRepository userRepository;
    @Autowired private ChatLanguageModel chatLanguageModel;

    private final RestTemplate restTemplate = new RestTemplate();

    /**
     * Extracts both long-term and short-term memory from a conversation and stores them.
     *
     * @param userId   the user ID
     * @param question the user question
     * @param answer   the assistant response
     * @return true if insights were successfully stored, false otherwise
     */
    public void extractAndStoreInsights(String userId, String userMessage, String aiResponse) {
        User user = userRepository.findByFirebaseUid(userId);
        if (user == null) {
            System.err.println("User not found for memory extraction: " + userId);
            return;
        }

        try {
            extractAndStoreCoreInformation(user, userMessage, aiResponse);
            extractAndStoreMemoryEmbedding(user.getId(), userMessage, aiResponse);
        } catch (Exception e) {
            System.err.println("Failed to store insights: " + e.getMessage());
        }
    }

    /**
     * Extracts and updates the user's long-term core information based on the conversation.
     *
     * @param user     the user entity
     * @param question the user's input
     * @param answer   the assistant's reply
     */
    private void extractAndStoreCoreInformation(User user, String question, String answer) {
        String corePrompt = buildCorePrompt(question, answer);
        String extractedCore = chatLanguageModel.chat(corePrompt).trim();
        logger.logToFile(user.getId(), "Extracting core information: " + extractedCore);

        if (!"none".equalsIgnoreCase(extractedCore)) {
            String existing = user.getCoreInformation() != null ? user.getCoreInformation() : "";
            String mergedPrompt = buildMergePrompt(existing, extractedCore);
            String updatedCore = chatLanguageModel.chat(mergedPrompt).trim();

            user.setCoreInformation(updatedCore);
            userRepository.save(user);
        }
    }

    /**
     * Extracts and sends short-term memory to the embedding service.
     *
     * @param userId   the user ID
     * @param question the user's input
     * @param answer   the assistant's reply
     */
    private void extractAndStoreMemoryEmbedding(String userId, String question, String answer) {
        String memoryPrompt = buildMemoryPrompt(question, answer);
        String memoryResult = chatLanguageModel.chat(memoryPrompt).trim();
        logger.logToFile(userId, "Extracting memory result: " + memoryResult);

        if (!"none".equalsIgnoreCase(memoryResult)) {
            try {
                HttpHeaders headers = new HttpHeaders();
                headers.setContentType(MediaType.APPLICATION_JSON);

                Map<String, Object> body = new HashMap<>();
                body.put("user_id", userId);
                body.put("text", memoryResult);
                body.put("timestamp", Instant.now().toString());

                HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);
                restTemplate.postForEntity("http://localhost:8000/remember", request, Void.class);
            } catch (Exception e) {
                System.err.println("Failed to store memory via /remember: " + e.getMessage());
            }
        }
    }

    /** Builds the prompt for extracting core identity facts. */
    private String buildCorePrompt(String question, String answer) {
        return """
            The user said: "%s"
            The assistant replied: "%s"
            
            Extract only long-term personal facts that help define the user's identity.
            Focus on:
            - Relationships (e.g., partner, family roles)
            - Occupation or studies (e.g., job title, major)
            - Hobbies or passions (e.g., music, running)
            - Basic biographical info (e.g., age, location, cultural identity)

            Do NOT include:
            - Daily events
            - Temporary plans or feelings
            - Assignments or tasks
            - Dates or time-based information

            Return a single natural-language sentence that summarises only newly discovered core facts.
            If there is nothing new or relevant, reply with "none".
        """.formatted(question, answer);
    }

    /** Builds the prompt for merging new core info with existing identity data. */
    private String buildMergePrompt(String existing, String newFact) {
        return """
            Existing core information:
            %s

            New core fact to merge:
            %s

            Combine and regenerate a concise updated version of the user's core information.
            If there is conflicting information, prefer the new information.
        """.formatted(existing, newFact);
    }

    /** Builds the prompt for extracting short-term or contextual memory. */
    private String buildMemoryPrompt(String question, String answer) {
        return """
            The user said: "%s"
            The assistant replied: "%s"

            Extract any short-term or event-specific information that may be useful for future questions.
            Examples:
            - Specific events or actions (e.g., went to the doctor, studied for an exam)
            - Emotions, preferences, or experiences (e.g., feeling anxious, loved the movie)
            - Short-term intentions or goals (e.g., plans to visit someone, aims to apply for internships)

            Do NOT include:
            - Facts already covered in long-term memory (e.g., age, occupation)
            - Vague or generic responses
            - Anything irrelevant or already known

            Return a concise sentence capturing the memory, or "none" if nothing is worth storing.
        """.formatted(question, answer);
    }

    /**
     * Manually add core information to user's profile
     */
    public void addManualCoreInformation(String firebaseUid, String coreInfo) {
        User user = userRepository.findByFirebaseUid(firebaseUid);
        if (user == null) {
            throw new RuntimeException("User not found: " + firebaseUid);
        }

        String existing = user.getCoreInformation() != null ? user.getCoreInformation() : "";
        String mergedPrompt = buildMergePrompt(existing, coreInfo);
        String updatedCore = chatLanguageModel.chat(mergedPrompt).trim();

        user.setCoreInformation(updatedCore);
        userRepository.save(user);
        logger.logToFile(firebaseUid, "Manual core information merged and saved: " + updatedCore);
    }

    /**
     * Manually add contextual memory to user's memory store
     */
    public void addManualContextualMemory(String firebaseUid, String contextualMemory) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            Map<String, Object> body = new HashMap<>();
            body.put("user_id", firebaseUid);
            body.put("text", contextualMemory);
            body.put("timestamp", Instant.now().toString());

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);
            restTemplate.postForEntity("http://localhost:8000/remember", request, Void.class);
            
            logger.logToFile(firebaseUid, "Manual contextual memory stored: " + contextualMemory);
        } catch (Exception e) {
            throw new RuntimeException("Failed to store manual contextual memory: " + e.getMessage());
        }
    }

    /**
     * Get user's current core information
     */
    public String getUserCoreInformation(String firebaseUid) {
        User user = userRepository.findByFirebaseUid(firebaseUid);
        if (user == null) {
            return "none";
        }
        return user.getCoreInformation() != null ? user.getCoreInformation() : "none";
    }
}