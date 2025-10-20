package com.example.ai_companion.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

/**
 * DTO for HeyGen text-to-speech requests
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class HeyGenTextToSpeechRequest {
    private String sessionId;
    private String text;
    private String voiceId;
    private Double speed = 1.0; // Default HeyGen speed
    private Double pitch = 1.0;
} 