package com.example.ai_companion.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

/**
 * DTO for HeyGen session creation requests
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class HeyGenSessionRequest {
    private String avatarId;
    private String version = "v2";
    private VoiceSettings voice;
    private Boolean disableIdleTimeout;
    private Integer activityIdleTimeout;
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class VoiceSettings {
        private String voiceId;
        private Double rate;
    }
} 