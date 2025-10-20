package com.example.ai_companion.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

/**
 * Represents a message within a specific cognitive game session.
 */
@Data
@Document(collection = "game_messages")
public class GameMessage {

    @Id
    private String id;

    private String gameSessionId;
    private String userId;
    private String text;
    private boolean fromUser;
    private Instant timestamp;

    public GameMessage(String gameSessionId, String userId, String text, boolean fromUser, Instant timestamp) {
        this.gameSessionId = gameSessionId;
        this.userId = userId;
        this.text = text;
        this.fromUser = fromUser;
        this.timestamp = timestamp;
    }
} 