package com.example.ai_companion.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.Instant;
import java.util.List;

@Data
@Document(collection = "reminders")
public class Reminder {

    @Id
    private String id;
    private String userId;
    private String title;
    private Instant timestamp;
    private String description;
    private List<ReminderTag> tags;
    private ReminderStatus status = ReminderStatus.INCOMPLETE;

    public Reminder(String userId, String title, Instant timestamp, String description, List<ReminderTag> tags) {
        this.userId = userId;
        this.title = title;
        this.timestamp = timestamp;
        this.description = description;
        this.tags = tags;
        this.status = ReminderStatus.INCOMPLETE;
    }

    public void updateStatus(ReminderStatus newStatus) {
        this.status = newStatus;
    }

    public void updateTimestamp(Instant newTimestamp) {
        this.timestamp = newTimestamp;
    }
    
    public void updateTitle(String newTitle) {
        this.title = newTitle;
    }
    
    public void updateDescription(String newDescription) {
        this.description = newDescription;
    }
    
    public void updateTags(List<ReminderTag> newTags) {
        this.tags = newTags;
    }
}
