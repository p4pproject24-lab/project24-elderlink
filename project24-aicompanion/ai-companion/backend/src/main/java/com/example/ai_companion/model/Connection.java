package com.example.ai_companion.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDateTime;

@Data
@Document(collection = "connections")
public class Connection {
    @Id
    private String id;
    private String caregiverId;
    private String elderlyId;
    private String status; // "pending", "approved", "rejected"
    private LocalDateTime createdAt;
    private LocalDateTime confirmedAt;
} 