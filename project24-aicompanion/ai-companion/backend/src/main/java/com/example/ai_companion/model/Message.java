package com.example.ai_companion.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Data
@Document(collection = "messages")
public class Message {

    @Id
    private String id;

    private String userId;
    private String text;
    private Instant timestamp = Instant.now();
    private boolean fromUser;

    public Message() {
    }

    public Message(String userId, String text, boolean fromUser, Instant timestamp) {
        this.userId = userId;
        this.text = text;
        this.fromUser = fromUser;
        this.timestamp = timestamp;
    }
}