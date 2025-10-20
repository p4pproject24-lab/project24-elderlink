package com.example.ai_companion.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

/**
 * DTO for HeyGen session start requests
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class HeyGenStartSessionRequest {
    private String sessionId;
} 