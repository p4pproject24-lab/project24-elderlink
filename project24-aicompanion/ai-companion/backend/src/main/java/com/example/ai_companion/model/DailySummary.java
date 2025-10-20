package com.example.ai_companion.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDate;
import java.util.Map;

@Document(collection = "daily_summaries")
public class DailySummary {
    @Id
    private String id;
    private String userId;
    private LocalDate date;
    private String summary;
    private Map<String, Integer> scores; // health, exercise, mental, social, etc.
    private String analysis;
    private String createdAt;
    private String updatedAt;

    public DailySummary() {}

    public DailySummary(String userId, LocalDate date, String summary, Map<String, Integer> scores, String analysis) {
        this.userId = userId;
        this.date = date;
        this.summary = summary;
        this.scores = scores;
        this.analysis = analysis;
        this.createdAt = java.time.LocalDateTime.now().toString();
        this.updatedAt = this.createdAt;
    }

    // Getters and Setters
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public LocalDate getDate() {
        return date;
    }

    public void setDate(LocalDate date) {
        this.date = date;
    }

    public String getSummary() {
        return summary;
    }

    public void setSummary(String summary) {
        this.summary = summary;
    }

    public Map<String, Integer> getScores() {
        return scores;
    }

    public void setScores(Map<String, Integer> scores) {
        this.scores = scores;
    }

    public String getAnalysis() {
        return analysis;
    }

    public void setAnalysis(String analysis) {
        this.analysis = analysis;
    }

    public String getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(String createdAt) {
        this.createdAt = createdAt;
    }

    public String getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(String updatedAt) {
        this.updatedAt = updatedAt;
    }
} 