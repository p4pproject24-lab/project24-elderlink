package com.example.ai_companion.response;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

/**
 * Response DTO for HeyGen session data
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class HeyGenSessionResponse {
    private String sessionId;
    private String token;
    private String status;
    private String avatarId;
    private String version;
    private String url; // LiveKit server URL
    private String accessToken; // LiveKit access token
} 