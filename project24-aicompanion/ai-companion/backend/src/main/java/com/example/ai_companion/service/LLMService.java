package com.example.ai_companion.service;

import com.example.ai_companion.model.Message;
import com.example.ai_companion.model.Reminder;
import com.example.ai_companion.model.User;
import com.example.ai_companion.repository.MessageRepository;
import com.example.ai_companion.repository.ReminderRepository;
import com.example.ai_companion.repository.UserRepository;
import com.example.ai_companion.utils.logger;
import dev.langchain4j.model.chat.ChatLanguageModel;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.Instant;

import java.util.*;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/**
 * Service responsible for handling AI interactions with the user, including:
 * - Generating contextual responses using LangChain LLM
 * - Retrieving recent messages, user core info, and reminders
 * - Fetching and embedding relevant memories
 * - Persisting interactions and extracted reminders
 */
@Service
public class LLMService {

    @Autowired private ChatLanguageModel chatLanguageModel;
    @Autowired private UserRepository userRepository;
    @Autowired private MessageRepository messageRepository;
    @Autowired private MemoryService memoryService;
    @Autowired private ReminderRepository reminderRepository;
    @Autowired private ReminderService reminderService;

    private final RestTemplate restTemplate = new RestTemplate();

    // Shared thread pool for async tasks
    private static final ExecutorService executor = Executors.newFixedThreadPool(8); // Tune pool size as needed

    /**
     * Generates a response to the user's query using context-aware memory and reminder information.
     *
     * @param userId the user ID (Firebase UID)
     * @param query the user's message
     * @param location the user's location info (may be null)
     * @return the assistant's response
     */
    public String generateAndTrack(String userId, String query, Object location, String logFilename) {
        double start = System.currentTimeMillis() / 1000.0;
        double stepStart, stepEnd;
        stepStart = System.currentTimeMillis() / 1000.0;
        User user = userRepository.findByFirebaseUid(userId);
        String coreInfo = (user != null && user.getCoreInformation() != null) ? user.getCoreInformation() : "none";
        stepEnd = System.currentTimeMillis() / 1000.0;
        if (logFilename != null) logger.logToFile(logFilename, "User retrieval: " + String.format("%.2f s", (stepEnd - stepStart)));

        stepStart = System.currentTimeMillis() / 1000.0;
        String chatHistory = buildChatHistory(userId);
        stepEnd = System.currentTimeMillis() / 1000.0;
        if (logFilename != null) logger.logToFile(logFilename, "Chat history retrieval: " + String.format("%.2f s", (stepEnd - stepStart)));

        stepStart = System.currentTimeMillis() / 1000.0;
        String reminderBlock = buildUpcomingRemindersBlock(userId);
        stepEnd = System.currentTimeMillis() / 1000.0;
        if (logFilename != null) logger.logToFile(logFilename, "Upcoming reminders retrieval: " + String.format("%.2f s", (stepEnd - stepStart)));

        // removing this step due to time complexity
        // stepStart = System.currentTimeMillis() / 1000.0;
        // String queryToSearch = generateMemoryQuery(query, chatHistory, coreInfo);
        // stepEnd = System.currentTimeMillis() / 1000.0;
        // if (logFilename != null) logger.logToFile(logFilename, "Memory query generation: " + String.format("%.2f s", (stepEnd - stepStart)));

        stepStart = System.currentTimeMillis() / 1000.0;
        String memoryContext = fetchMemoryContext(userId, query);
        stepEnd = System.currentTimeMillis() / 1000.0;
        if (logFilename != null) logger.logToFile(logFilename, "Memory context retrieval: " + String.format("%.2f s", (stepEnd - stepStart)));

        String today = java.time.LocalDate.now().toString();
        stepStart = System.currentTimeMillis() / 1000.0;
        String prompt = buildLLMPrompt(today, coreInfo, memoryContext, chatHistory, reminderBlock, query, location);
        stepEnd = System.currentTimeMillis() / 1000.0;
        if (logFilename != null) logger.logToFile(logFilename, "LLM prompt building: " + String.format("%.2f s", (stepEnd - stepStart)));

        stepStart = System.currentTimeMillis() / 1000.0;
        String responseText = chatLanguageModel.chat(prompt);
        stepEnd = System.currentTimeMillis() / 1000.0;
        if (logFilename != null) logger.logToFile(logFilename, "LLM response generation: " + String.format("%.2f s", (stepEnd - stepStart)));

        // Only log full prompt and chat history if this is the first user message
        boolean isFirstMessage = chatHistory == null || chatHistory.trim().isEmpty();
        if (isFirstMessage) {
            if (logFilename != null) logger.logToFile(logFilename, "LLM Prompt: " + prompt);
            if (logFilename != null) logger.logToFile(logFilename, "LLM Response: " + responseText);
        }

        double end = System.currentTimeMillis() / 1000.0;
        if (logFilename != null) logger.logToFile(logFilename, "Total generateAndTrack time: " + String.format("%.2f s", (end - start)));
        return responseText;
    }

    // Overload for backward compatibility
    public String generateAndTrack(String userId, String query, Object location) {
        return generateAndTrack(userId, query, location, null);
    }

    /**
     * Generates a response from a given prompt without the full context of chat history and memory.
     * Used for generating welcome messages and other standalone responses.
     *
     * @param prompt the prompt to generate a response for
     * @return the generated response
     */
    public String generateResponse(String prompt) {
        String responseText = chatLanguageModel.chat(prompt);
        logger.logToFile("system", "Generated response from prompt: " + responseText);
        return responseText;
    }

    /** Builds the user's last 10 messages in chronological order. */
    private String buildChatHistory(String userId) {
        List<Message> messages = messageRepository.findTop10ByUserIdOrderByTimestampDesc(userId);
        messages.sort(Comparator.comparing(Message::getTimestamp));
        StringBuilder sb = new StringBuilder();
        for (Message m : messages) {
            sb.append(m.isFromUser() ? "User: " : "Assistant: ")
              .append(m.getText()).append("\n");
        }
        return sb.toString().trim();
    }

    /** Builds a block summarising the user's next 10 reminders. */
    private String buildUpcomingRemindersBlock(String userId) {
        List<Reminder> reminders = reminderRepository.findTop10ByUserIdAndTimestampGreaterThanOrderByTimestampAsc(userId, Instant.now());
        if (reminders.isEmpty()) return "none";

        StringBuilder sb = new StringBuilder();
        for (Reminder r : reminders) {
            sb.append("Title: ").append(r.getTitle()).append("\n")
              .append("Description: ").append(r.getDescription()).append("\n")
              .append("Due: ").append(r.getTimestamp()).append("\n")
              .append("Tags: ").append(r.getTags() != null ? String.join(", ", r.getTags().stream().map(Enum::name).toList()) : "none").append("\n")
              .append("Status: ").append(r.getStatus()).append("\n\n");
        }
        return sb.toString().trim();
    }

    /** Fetches memory context from the memory embedding service. */
    private String fetchMemoryContext(String userId, String query) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            Map<String, Object> body = new HashMap<>();
            body.put("user_id", userId);
            body.put("query", query);
            body.put("top_k", 5);
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);

            ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                "http://localhost:8000/recall",
                HttpMethod.POST,
                request,
                new org.springframework.core.ParameterizedTypeReference<>() {}
            );

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                Map<String, Object> responseBody = response.getBody();
                if (responseBody != null) {
                    Object memories = responseBody.get("related_memories");
                    return memories != null ? memories.toString() : "none";
                }
                return "none";
            }
        } catch (Exception e) {
            System.err.println("Failed to retrieve memory context: " + e.getMessage());
        }
        return "none";
    }

        /** Builds a prompt to convert the user's question into a memory search query. */
        private String generateMemoryQuery(String query, String chatHistory, String coreInfo) {
            String prompt = """
                You are a memory assistant. Your job is to convert the user's current message into a memory-style search query.
    
                The user's message is:
                "%s"
    
                These are the last 10 messages in the conversation:
                %s
    
                The user's long-term core information is:
                %s
    
                Create a concise sentence that best represents the kind of memory that would be relevant to this message, using the same structure as stored memory sentences.
    
                Memory entries typically describe:
                - Specific past events or experiences
                - Short-term goals or plans
                - Emotions or reactions
    
                Your output should be a single memory-style sentence. If nothing is relevant, return "none".
                """.formatted(query, chatHistory, coreInfo);
            return chatLanguageModel.chat(prompt);
        }

    /** Builds the final prompt sent to the LLM. */
    private String buildLLMPrompt(String today, String coreInfo, String memoryContext, String chatHistory, String reminders, String query, Object location) {
        String locationBlock = "none";
        if (location != null) {
            locationBlock = location.toString();
        }
        return """
            Today is %s.
            You are a personalised virtual assistant designed for elderly care. Your role is to respond supportively and clearly, considering the user's health, personal background, daily context, and emotional needs.

            --- USER PROFILE (Long-Term Core Info) ---
            %s

            --- RECENT MEMORIES (Contextual Events) ---
            %s

            --- CHAT HISTORY (Recent Conversation) ---
            %s

            --- UPCOMING REMINDERS (Tasks to Remember, include time if needed) ---
            %s

            --- USER LOCATION (If available) ---
            %s

            --- USER QUESTION ---
            The user said: "%s"

            IMPORTANT: You can automatically create reminders for users when they mention tasks or appointments. If someone asks you to remind them of something or mentions a future task, reassure them that you will remember it for them.
            
            Respond in a way that shows:
            • Kindness and patience
            • Clear and simple language (suitable for older adults)
            • Lighthearted charm
            • No technical jargon
            • Use the user's location to provide relevant information if necessary 
            • Do not use emojis
            • Write in warm, engaging, natural-sounding language
            • try to Keep responses short and concise if possible (2-3 sentences generally) but if you need to go into more detail, do so.
            • Use simple, easy-to-understand words
            • Be direct and to the point
            • When users mention tasks, appointments, or ask for reminders, confirm that you'll remember it for them
            """.formatted(today, coreInfo, memoryContext, chatHistory, reminders, locationBlock, query);
    }
}