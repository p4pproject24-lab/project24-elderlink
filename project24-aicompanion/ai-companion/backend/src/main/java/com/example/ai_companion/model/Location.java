package com.example.ai_companion.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.Instant;

@Data
@Document(collection = "locations")
public class Location {
    @Id
    private String id;
    private String userId;
    private double latitude;
    private double longitude;
    private Instant timestamp;

    public Location(String userId, double latitude, double longitude, Instant timestamp) {
        this.userId = userId;
        this.latitude = latitude;
        this.longitude = longitude;
        this.timestamp = timestamp;
    }
}
