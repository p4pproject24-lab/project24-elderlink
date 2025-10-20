package com.example.ai_companion.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

/**
 * DTO for HeyGen audio streaming requests
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class HeyGenAudioRequest {
    private String sessionId;
    private String audioData; // Base64 encoded audio
    private String audioFormat = "wav"; // Default format
    private Integer sampleRate = 16000; // Default sample rate
} 