package com.example.ai_companion.response;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

/**
 * Response DTO for HeyGen audio streaming data
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class HeyGenAudioResponse {
    private String sessionId;
    private String audioData; // Base64 encoded audio response
    private String audioFormat;
    private Integer sampleRate;
    private String status;
    private String message;
} 