package com.example.ai_companion.service;

import com.example.ai_companion.model.Reminder;
import com.example.ai_companion.model.ReminderTag;
import com.example.ai_companion.repository.ReminderRepository;
import com.example.ai_companion.utils.logger;
import dev.langchain4j.model.chat.ChatLanguageModel;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.*;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.List;
import java.util.Arrays;
import java.util.stream.Collectors;

/**
 * Service responsible for extracting reminders from user messages
 * using natural language processing and storing them in the database.
 */
@Service
public class ReminderService {

    @Autowired private ChatLanguageModel chatLanguageModel;
    @Autowired private ReminderRepository reminderRepository;

    /**
     * Extracts reminders from the user's message and stores them in the database.
     * Supports reminders with or without time components.
     *
     * @param userId      the user ID
     * @param userMessage the user's message potentially containing reminder info
     */
    public void extractReminders(String userId, String userMessage) {
        String today = LocalDate.now().toString();
        String prompt = buildPrompt(today, userMessage);
        String response = chatLanguageModel.chat(prompt).trim();
        logger.logToFile(userId, "Reminder extraction response: " + response);

        if (response.equalsIgnoreCase("none")) return;

        parseAndStoreReminders(response, userId);
    }

    /**
     * Builds the prompt to send to the LLM for extracting structured reminders.
     */
    private String buildPrompt(String today, String message) {
        return """
            Today is %s.

            The user said: "%s"

            Your job is to extract reminders from this message. A reminder includes a task and a date/time when it should be done.
            Use today's date to resolve time expressions like "tomorrow" or "next Thursday" into specific calendar dates.

            Return one or more reminders in the following format (each on its own line if there are multiple):

            Task: <the main task title>
            Date: <date in YYYY-MM-DD or YYYY-MM-DD HH:mm>
            Description: <a short description of the task>
            Tags: <comma-separated list of: MEDICATION, APPOINTMENT, EVENT, TASK, PERSONAL, WORK, FINANCE, HEALTH, TRAVEL, SOCIAL, EDUCATION, LEISURE, OTHER>

            If there are no reminders to extract, just reply with "none".
        """.formatted(today, message);
    }

    /**
     * Parses the LLM response line by line and saves valid reminders.
     */
    private void parseAndStoreReminders(String response, String userId) {
        String[] lines = response.split("\\r?\\n");

        String task = null, date = null, description = "", tag = null;

        for (String line : lines) {
            line = line.trim();
            if (line.toLowerCase().startsWith("task:")) {
                task = line.substring(5).trim();
            } else if (line.toLowerCase().startsWith("date:")) {
                date = line.substring(5).trim();
            } else if (line.toLowerCase().startsWith("description:")) {
                description = line.substring(12).trim();
            } else if (line.toLowerCase().startsWith("tags:")) {
                tag = line.substring(5).trim().toUpperCase();
            }

            if (task != null && date != null && tag != null) {
                Instant timestamp = parseDateToInstant(date, userId);
                if (timestamp != null) {
                    // Parse comma-separated tags
                    List<ReminderTag> tags = parseTags(tag);
                    Reminder reminder = new Reminder(userId, task, timestamp, description, tags);
                    reminderRepository.save(reminder);
                    logger.logToFile(userId, "Saved reminder: " + reminder);
                }

                // Reset fields for next reminder
                task = null;
                date = null;
                description = "";
                tag = null;
            }
        }
    }

    /**
     * Parses a comma-separated string of tags into a list of ReminderTag enums.
     */
    private List<ReminderTag> parseTags(String tagString) {
        if (tagString == null || tagString.trim().isEmpty()) {
            return Arrays.asList(ReminderTag.OTHER);
        }
        
        return Arrays.stream(tagString.split(","))
            .map(String::trim)
            .filter(s -> !s.isEmpty())
            .map(s -> {
                try {
                    return ReminderTag.valueOf(s.toUpperCase());
                } catch (IllegalArgumentException e) {
                    return ReminderTag.OTHER;
                }
            })
            .collect(Collectors.toList());
    }

    /**
     * Parses a date string into an Instant. Handles full ISO, date + time, or just date.
     * Defaults to 12:00 noon UTC if time is not given.
     */
    private Instant parseDateToInstant(String date, String userId) {
        try {
            // Try full ISO-8601 datetime format
            return Instant.parse(date);
        } catch (DateTimeParseException e1) {
            try {
                // Try "yyyy-MM-dd HH:mm"
                DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");
                LocalDateTime dateTime = LocalDateTime.parse(date, formatter);
                return dateTime.atZone(ZoneId.of("UTC")).toInstant();
            } catch (DateTimeParseException e2) {
                try {
                    // Fallback: just "yyyy-MM-dd", assume noon
                    LocalDate localDate = LocalDate.parse(date);
                    LocalTime midday = LocalTime.of(12, 0);
                    return LocalDateTime.of(localDate, midday).atZone(ZoneId.of("UTC")).toInstant();
                } catch (DateTimeParseException e3) {
                    logger.logToFile(userId, "Failed to parse reminder date: " + date);
                    return null;
                }
            }
        }
    }
}