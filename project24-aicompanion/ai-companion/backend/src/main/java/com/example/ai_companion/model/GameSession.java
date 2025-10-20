package com.example.ai_companion.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

/**
 * Represents a cognitive game session that a user can create and participate in.
 */
@Data
@Document(collection = "game_sessions")
public class GameSession {

    @Id
    private String id;

    private String userId;
    private String title;
    private String description;
    private String gameType; // "generated" or "custom"
    private String initialPrompt; // The user's description for custom games
    private Instant createdAt;
    private Instant lastActivityAt;
    private boolean isActive;

    public GameSession(String userId, String title, String description, String gameType, String initialPrompt) {
        this.userId = userId;
        this.title = title;
        this.description = description;
        this.gameType = gameType;
        this.initialPrompt = initialPrompt;
        this.createdAt = Instant.now();
        this.lastActivityAt = Instant.now();
        this.isActive = true;
    }
} 