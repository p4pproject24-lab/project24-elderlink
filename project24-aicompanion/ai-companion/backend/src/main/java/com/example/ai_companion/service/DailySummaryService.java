package com.example.ai_companion.service;

import com.example.ai_companion.model.DailySummary;
import com.example.ai_companion.model.Message;
import com.example.ai_companion.repository.DailySummaryRepository;
import com.example.ai_companion.repository.MessageRepository;
import com.example.ai_companion.utils.logger;
import dev.langchain4j.model.chat.ChatLanguageModel;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class DailySummaryService {

    @Autowired
    private DailySummaryRepository dailySummaryRepository;

    @Autowired
    private MessageRepository messageRepository;

    @Autowired
    private ChatLanguageModel chatLanguageModel;

    public DailySummary getDailySummary(String userId, LocalDate date) {
        return dailySummaryRepository.findByUserIdAndDate(userId, date).orElse(null);
    }

    public List<DailySummary> getUserDailySummaries(String userId) {
        return dailySummaryRepository.findByUserIdOrderByDateDesc(userId);
    }

    public boolean dailySummaryExists(String userId, LocalDate date) {
        return dailySummaryRepository.existsByUserIdAndDate(userId, date);
    }

    public boolean canGenerateSummary(String userId, LocalDate date, ZoneOffset userOffset) {
        logger.logToFile("daily_summary_service", "Checking if can generate summary for user: " + userId + ", date: " + date + ", offset: " + userOffset);
        
        // Check if it's a past date (not today)
        LocalDate today = LocalDate.now(userOffset);
        if (date.isAfter(today) || date.isEqual(today)) {
            logger.logToFile("daily_summary_service", "Cannot generate: Date is today or in the future");
            return false;
        }

        // Check if summary already exists
        if (dailySummaryRepository.existsByUserIdAndDate(userId, date)) {
            logger.logToFile("daily_summary_service", "Cannot generate: Summary already exists");
            return false;
        }

        // Check if there are messages for that date
        List<Message> messages = getMessagesForDate(userId, date, userOffset);
        logger.logToFile("daily_summary_service", "Found " + messages.size() + " messages for date: " + date);
        return !messages.isEmpty();
    }

    public DailySummary generateDailySummary(String userId, LocalDate date, ZoneOffset userOffset) throws Exception {
        // Validate that we can generate a summary
        if (!canGenerateSummary(userId, date, userOffset)) {
            throw new IllegalArgumentException("Cannot generate summary for this date");
        }

        // Get messages for the date
        List<Message> messages = getMessagesForDate(userId, date, userOffset);
        if (messages.isEmpty()) {
            throw new IllegalArgumentException("No messages found for this date");
        }

        // Compile chat history into a prompt
        String chatHistory = compileChatHistory(messages);
        
        // Generate AI analysis
        String analysisPrompt = createAnalysisPrompt(chatHistory, date);
        String aiResponse = chatLanguageModel.chat(analysisPrompt);

        // Parse AI response to extract summary, scores, and analysis
        Map<String, Object> parsedResponse = parseAIResponse(aiResponse);

        // Create and save daily summary
        DailySummary dailySummary = new DailySummary(
            userId,
            date,
            (String) parsedResponse.get("summary"),
            (Map<String, Integer>) parsedResponse.get("scores"),
            (String) parsedResponse.get("analysis")
        );

        logger.logToFile("daily_summary_service", "Generated daily summary for user " + userId + " on " + date);
        return dailySummaryRepository.save(dailySummary);
    }

    private List<Message> getMessagesForDate(String userId, LocalDate date, ZoneOffset userOffset) {
        // 12pm (noon) of the given date in user's local time
        Instant startOfWindow = date.atTime(12, 0).atOffset(userOffset).toInstant();
        // 11:59:59.999999999am of the next day in user's local time
        Instant endOfWindow = date.plusDays(1).atTime(11, 59, 59, 999_999_999).atOffset(userOffset).toInstant();
        
        logger.logToFile("daily_summary_service", "Getting messages for user: " + userId + ", date: " + date + ", offset: " + userOffset);
        logger.logToFile("daily_summary_service", "12pm-to-12pm window: " + startOfWindow + " to " + endOfWindow);
        
        List<Message> allMessages = messageRepository.findByUserId(userId);
        logger.logToFile("daily_summary_service", "Total messages for user: " + allMessages.size());
        
        List<Message> filteredMessages = allMessages.stream()
            .filter(message -> {
                Instant messageTime = message.getTimestamp();
                boolean inRange = !messageTime.isBefore(startOfWindow) && !messageTime.isAfter(endOfWindow);
                if (inRange) {
                    logger.logToFile("daily_summary_service", "Message in 12pm-12pm range: " + message.getText().substring(0, Math.min(50, message.getText().length())) + "...");
                }
                return inRange;
            })
            .sorted((m1, m2) -> m1.getTimestamp().compareTo(m2.getTimestamp()))
            .toList();
            
        logger.logToFile("daily_summary_service", "Filtered messages for 12pm-12pm window: " + filteredMessages.size());
        return filteredMessages;
    }

    private String compileChatHistory(List<Message> messages) {
        StringBuilder history = new StringBuilder();
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("HH:mm");
        
        for (Message message : messages) {
            String time = LocalDateTime.ofInstant(message.getTimestamp(), java.time.ZoneOffset.UTC).format(formatter);
            String sender = message.isFromUser() ? "User" : "Assistant";
            history.append(String.format("[%s] %s: %s\n", time, sender, message.getText()));
        }
        
        return history.toString();
    }

    private String createAnalysisPrompt(String chatHistory, LocalDate date) {
        return String.format(
            "Analyze the following chat history from %s and provide a comprehensive daily summary. " +
            "Please respond in the following JSON format:\n" +
            "{\n" +
            "  \"summary\": \"A concise summary of what the person did and discussed today\",\n" +
            "  \"scores\": {\n" +
            "    \"health\": <score 1-10>,\n" +
            "    \"exercise\": <score 1-10>,\n" +
            "    \"mental\": <score 1-10>,\n" +
            "    \"social\": <score 1-10>,\n" +
            "    \"productivity\": <score 1-10>\n" +
            "  },\n" +
            "  \"analysis\": \"Detailed analysis of their day including mood, activities, and insights\"\n" +
            "}\n\n" +
            "Chat History:\n%s",
            date.toString(), chatHistory
        );
    }

    private Map<String, Object> parseAIResponse(String aiResponse) {
        Map<String, Object> result = new HashMap<>();
        
        try {
            // Extract JSON from AI response (handle cases where AI might add extra text)
            int jsonStart = aiResponse.indexOf('{');
            int jsonEnd = aiResponse.lastIndexOf('}') + 1;
            
            if (jsonStart >= 0 && jsonEnd > jsonStart) {
                String jsonString = aiResponse.substring(jsonStart, jsonEnd);
                
                // Simple JSON parsing (you might want to use a proper JSON library)
                // For now, we'll extract the main components
                result.put("summary", extractValue(jsonString, "summary"));
                result.put("scores", extractScores(jsonString));
                result.put("analysis", extractValue(jsonString, "analysis"));
            } else {
                // Fallback if JSON parsing fails
                result.put("summary", "Unable to parse AI response");
                result.put("scores", createDefaultScores());
                result.put("analysis", aiResponse);
            }
        } catch (Exception e) {
            logger.logToFile("daily_summary_service", "Error parsing AI response: " + e.getMessage());
            result.put("summary", "Error processing summary");
            result.put("scores", createDefaultScores());
            result.put("analysis", aiResponse);
        }
        
        return result;
    }

    private String extractValue(String json, String key) {
        try {
            int start = json.indexOf("\"" + key + "\":");
            if (start == -1) return "";
            
            start = json.indexOf("\"", start + key.length() + 3) + 1;
            int end = json.indexOf("\"", start);
            
            if (start > 0 && end > start) {
                return json.substring(start, end);
            }
        } catch (Exception e) {
            logger.logToFile("daily_summary_service", "Error extracting value for " + key + ": " + e.getMessage());
        }
        return "";
    }

    private Map<String, Integer> extractScores(String json) {
        Map<String, Integer> scores = new HashMap<>();
        String[] scoreKeys = {"health", "exercise", "mental", "social", "productivity"};
        
        for (String key : scoreKeys) {
            try {
                int start = json.indexOf("\"" + key + "\":");
                if (start == -1) {
                    scores.put(key, 5); // Default score
                    continue;
                }
                
                start = json.indexOf(":", start) + 1;
                int end = json.indexOf(",", start);
                if (end == -1) end = json.indexOf("}", start);
                
                if (start > 0 && end > start) {
                    String scoreStr = json.substring(start, end).trim();
                    int score = Integer.parseInt(scoreStr);
                    scores.put(key, Math.max(1, Math.min(10, score))); // Ensure score is between 1-10
                } else {
                    scores.put(key, 5);
                }
            } catch (Exception e) {
                logger.logToFile("daily_summary_service", "Error extracting score for " + key + ": " + e.getMessage());
                scores.put(key, 5);
            }
        }
        
        return scores;
    }

    private Map<String, Integer> createDefaultScores() {
        Map<String, Integer> scores = new HashMap<>();
        scores.put("health", 5);
        scores.put("exercise", 5);
        scores.put("mental", 5);
        scores.put("social", 5);
        scores.put("productivity", 5);
        return scores;
    }

    public void deleteDailySummary(String userId, LocalDate date) {
        dailySummaryRepository.deleteByUserIdAndDate(userId, date);
    }
} 