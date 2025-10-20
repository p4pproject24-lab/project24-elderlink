package com.example.ai_companion.service;

import com.example.ai_companion.dto.HeyGenSessionRequest;
import com.example.ai_companion.dto.HeyGenStartSessionRequest;
import com.example.ai_companion.response.HeyGenSessionResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import java.util.HashMap;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import java.util.concurrent.ConcurrentHashMap;
import com.example.ai_companion.utils.logger;
import javax.annotation.PostConstruct;

@Service
public class HeyGenService {

    private static final Logger log = LoggerFactory.getLogger(HeyGenService.class);

    @Value("${avatar.api.key:}")
    private String apiKey;

    @PostConstruct
    public void init() {
        // Check if API key is loaded
        if (apiKey == null || apiKey.isEmpty()) {
            log.error("HeyGen API key is not loaded! Please check your .env file or environment variables.");
            log.error("Expected: AVATAR_STREAMING_API_KEY in .env file");
        } else {
            log.info("HeyGen API key loaded successfully");
        }
    }

    private static final String TOKEN_URL = "https://api.heygen.com/v1/streaming.create_token";
    private static final String SESSION_URL = "https://api.heygen.com/v1/streaming.new";
    private static final String START_URL = "https://api.heygen.com/v1/streaming.start";
    private static final String TASK_URL = "https://api.heygen.com/v1/streaming.task";

    private final Map<String, String> userIdToSessionId = new ConcurrentHashMap<>();

    public String createSessionToken() {
        System.out.println("[NEW]:" + apiKey);
        RestTemplate restTemplate = new RestTemplate();
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("x-api-key", apiKey);
        HttpEntity<Map<String, Object>> request = new HttpEntity<>(new HashMap<>(), headers);
        log.info("Requesting HeyGen session token with headers: {}", headers);
        ResponseEntity<Map> response = restTemplate.postForEntity(TOKEN_URL, request, Map.class);
        log.info("HeyGen session token response: {}", response.getBody());
        if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
            Map<String, Object> data = (Map<String, Object>) response.getBody().get("data");
            if (data != null && data.containsKey("token")) {
                log.info("HeyGen session token: {}", data.get("token"));
                return (String) data.get("token");
            }
        }
        log.error("Failed to get HeyGen session token: {}", response.getBody());
        throw new RuntimeException("Failed to get HeyGen session token");
    }

    public HeyGenSessionResponse createSession(HeyGenSessionRequest req) {
        // First, try to close any existing sessions to free up capacity
        log.info("[HeyGenService] Attempting to close any existing sessions before creating new one");
        try {
            // Close all existing sessions in our tracking map
            for (Map.Entry<String, String> entry : userIdToSessionId.entrySet()) {
                String sessionId = entry.getValue();
                if (sessionId != null) {
                    log.info("[HeyGenService] Closing existing session {} for user {}", sessionId, entry.getKey());
                    stopSession(sessionId);
                }
            }
            // Clear the tracking map
            userIdToSessionId.clear();
            log.info("[HeyGenService] Cleared session tracking map");
        } catch (Exception e) {
            log.warn("[HeyGenService] Error while closing existing sessions: {}", e.getMessage());
        }
        
        RestTemplate restTemplate = new RestTemplate();
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("x-api-key", apiKey);
        Map<String, Object> body = new HashMap<>();
        body.put("avatar_id", req.getAvatarId()); // Use avatar_id as per API docs
        body.put("version", req.getVersion());
        body.put("quality", "high"); // Add quality setting
        
        // Add timeout settings to prevent AI from timing out
        if (req.getDisableIdleTimeout() != null) {
            body.put("disable_idle_timeout", req.getDisableIdleTimeout());
            log.info("Setting disable_idle_timeout: {}", req.getDisableIdleTimeout());
        }
        if (req.getActivityIdleTimeout() != null) {
            body.put("activity_idle_timeout", req.getActivityIdleTimeout());
            log.info("Setting activity_idle_timeout: {}", req.getActivityIdleTimeout());
        }
        
        // Add voice settings if provided
        if (req.getVoice() != null) {
            Map<String, Object> voiceSettings = new HashMap<>();
            
            // Use the voice ID from the request if provided, otherwise use the avatar's default voice
            if (req.getVoice().getVoiceId() != null) {
                voiceSettings.put("voice_id", req.getVoice().getVoiceId());
                log.info("Using custom voice_id: {}", req.getVoice().getVoiceId());
            } else {
                // Get the avatar's default voice
                String avatarDefaultVoice = getAvatarDefaultVoice(req.getAvatarId());
                if (avatarDefaultVoice != null) {
                    voiceSettings.put("voice_id", avatarDefaultVoice);
                    log.info("Using avatar's default voice: {} for avatar: {}", avatarDefaultVoice, req.getAvatarId());
                } else {
                    // Fallback to a known working voice if avatar default voice not found
                    voiceSettings.put("voice_id", "1776ddbd05374fa480e92f0297bbc67e");
                    log.warn("Avatar default voice not found, using fallback voice: 1776ddbd05374fa480e92f0297bbc67e (Melissa - Friendly)");
                }
            }
            
            // Use the rate from the request if provided, otherwise use default 0.95
            if (req.getVoice().getRate() != null) {
                voiceSettings.put("rate", req.getVoice().getRate());
                log.info("Using custom rate: {}", req.getVoice().getRate());
            } else {
                voiceSettings.put("rate", 0.95); // Default rate
                log.info("Using default rate: 0.95");
            }
            
            log.info("Using voice settings: voice_id={}, rate={}", voiceSettings.get("voice_id"), voiceSettings.get("rate"));
            log.info("Voice rate change applied: {} (this should affect the avatar's speech speed)", voiceSettings.get("rate"));
        log.info("Testing voice rate: If this is 0.8, avatar should speak slower. If this is 1.5+, avatar should speak faster.");

            if (!voiceSettings.isEmpty()) {
                body.put("voice", voiceSettings);
            }
        } else {
            // No voice settings provided - use default rate with the avatar's default voice
            Map<String, Object> voiceSettings = new HashMap<>();
            String avatarDefaultVoice = getAvatarDefaultVoice(req.getAvatarId());
            if (avatarDefaultVoice != null) {
                voiceSettings.put("voice_id", avatarDefaultVoice);
                log.info("Using avatar's default voice: {} with default rate: 0.95", avatarDefaultVoice);
            } else {
                // Fallback to a known working voice if avatar default voice not found
                voiceSettings.put("voice_id", "1776ddbd05374fa480e92f0297bbc67e");
                log.warn("Avatar default voice not found, using fallback voice with default rate: 0.95");
            }
            voiceSettings.put("rate", 0.95); // Default rate
            body.put("voice", voiceSettings);
        }
        
        log.info("Creating HeyGen session with body: {}", body);
        log.info("Voice settings: {}", req.getVoice());
        log.info("Voice rate being sent: {}", req.getVoice() != null ? req.getVoice().getRate() : "null");
        log.info("=== VOICE RATE DEBUG ===");
        log.info("Request voice object: {}", req.getVoice());
        log.info("Voice rate value: {}", req.getVoice() != null ? req.getVoice().getRate() : "null");
        log.info("Voice rate type: {}", req.getVoice() != null && req.getVoice().getRate() != null ? req.getVoice().getRate().getClass().getSimpleName() : "null");
        log.info("Final voice settings in body: {}", body.get("voice"));
        log.info("=== END VOICE RATE DEBUG ===");
        HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);
        ResponseEntity<Map> response = restTemplate.postForEntity(SESSION_URL, request, Map.class);
        log.info("HeyGen create session response (raw): {}", response.getBody());
        log.info("HeyGen create session response (voice settings in response): {}", 
            response.getBody() != null && response.getBody().containsKey("data") ? 
            ((Map)response.getBody().get("data")).get("voice") : "no voice data");
        
        // Additional voice rate debugging
        if (response.getBody() != null && response.getBody().containsKey("data")) {
            Map<String, Object> data = (Map<String, Object>) response.getBody().get("data");
            if (data != null && data.containsKey("voice")) {
                Map<String, Object> responseVoice = (Map<String, Object>) data.get("voice");
                log.info("=== HEYGEN VOICE RESPONSE DEBUG ===");
                log.info("HeyGen accepted voice settings: {}", responseVoice);
                log.info("HeyGen voice rate in response: {}", responseVoice.get("rate"));
                log.info("HeyGen voice_id in response: {}", responseVoice.get("voice_id"));
                log.info("=== END HEYGEN VOICE RESPONSE DEBUG ===");
            } else {
                log.warn("No voice settings found in HeyGen response data");
            }
        }
        if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
            Map<String, Object> data = (Map<String, Object>) response.getBody().get("data");
            log.info("HeyGen create session response (data): {}", data);
            HeyGenSessionResponse sessionResponse = new HeyGenSessionResponse();
            if (data != null) {
                sessionResponse.setSessionId((String) data.get("session_id"));
                sessionResponse.setToken((String) data.get("token"));
                sessionResponse.setStatus((String) data.get("status"));
                sessionResponse.setAvatarId((String) data.get("avatar_id"));
                sessionResponse.setVersion((String) data.get("version"));
                sessionResponse.setUrl((String) data.get("url"));
                sessionResponse.setAccessToken((String) data.get("access_token"));
            }
            log.info("HeyGen create session response (final): {}", sessionResponse);
            return sessionResponse;
        }
        log.error("Failed to create HeyGen session: {}", response.getBody());
        throw new RuntimeException("Failed to create HeyGen session");
    }

    public HeyGenSessionResponse startSession(String firebaseUid, HeyGenStartSessionRequest req) {
        log.info("[HeyGenService] Starting session for user: {}, sessionId: {}", firebaseUid, req.getSessionId());
        if (firebaseUid != null) {
            String previousSessionId = userIdToSessionId.get(firebaseUid);
            log.info("[HeyGenService] Previous session for user {}: {}", firebaseUid, previousSessionId);
            if (previousSessionId != null && !previousSessionId.equals(req.getSessionId())) {
                log.info("[HeyGenService] Closing previous session {} for user {}", previousSessionId, firebaseUid);
                stopSession(previousSessionId);
            } else {
                log.info("[HeyGenService] No previous session to close for user {}", firebaseUid);
            }
            userIdToSessionId.put(firebaseUid, req.getSessionId());
            log.info("[HeyGenService] Updated session mapping for user {}: {}", firebaseUid, req.getSessionId());
        } else {
            log.warn("[HeyGenService] No firebaseUid provided, skipping session tracking");
        }
        RestTemplate restTemplate = new RestTemplate();
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("x-api-key", apiKey);
        Map<String, Object> body = new HashMap<>();
        body.put("session_id", req.getSessionId());
        log.info("Starting HeyGen session with body: {}", body);
        HttpEntity<Map<String, Object>> requestEntity = new HttpEntity<>(body, headers);
        try {
            ResponseEntity<Map> response = restTemplate.postForEntity(START_URL, requestEntity, Map.class);
            log.info("HeyGen start session response (raw): {}", response.getBody());
            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                Map<String, Object> data = (Map<String, Object>) response.getBody().get("data");
                log.info("HeyGen start session response (data): {}", data);
                HeyGenSessionResponse sessionResponse = new HeyGenSessionResponse();
                if (data != null) {
                    sessionResponse.setSessionId((String) data.get("session_id"));
                    sessionResponse.setToken((String) data.get("token"));
                    sessionResponse.setStatus((String) data.get("status"));
                    sessionResponse.setAvatarId((String) data.get("avatar_id"));
                    sessionResponse.setVersion((String) data.get("version"));
                    sessionResponse.setUrl((String) data.get("url"));
                    sessionResponse.setAccessToken((String) data.get("access_token"));
                } else {
                    // If data is null, fallback to request values
                    sessionResponse.setSessionId(req.getSessionId());
                    sessionResponse.setStatus("started");
                }
                log.info("HeyGen start session response (final): {}", sessionResponse);
                return sessionResponse;
            }
            log.error("Failed to start HeyGen session: {}", response.getBody());
            throw new RuntimeException("Failed to start HeyGen session");
        } catch (Exception e) {
            log.error("Error starting HeyGen session: {}", e.getMessage());
            if (e.getMessage().contains("session state wrong: closed")) {
                throw new RuntimeException("Session has been closed. Please create a new session.");
            }
            throw new RuntimeException("Failed to start HeyGen session: " + e.getMessage());
        }
    }

    // Method to send text to avatar (talk or repeat)
    public Map<String, Object> sendTaskToHeyGen(String sessionId, String text, String taskType, String logFilename) {
        long stepStart = System.currentTimeMillis();
        if (logFilename != null) logger.logToFile(logFilename, "[HeyGenService] SENDING TO HEYGEN: " + text);
        org.springframework.web.client.RestTemplate restTemplate = new org.springframework.web.client.RestTemplate();
        org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
        headers.setContentType(org.springframework.http.MediaType.APPLICATION_JSON);
        headers.set("x-api-key", apiKey);
        java.util.Map<String, Object> body = new java.util.HashMap<>();
        body.put("session_id", sessionId);
        body.put("text", text);
        body.put("task_type", taskType);
        org.springframework.http.HttpEntity<java.util.Map<String, Object>> request = new org.springframework.http.HttpEntity<>(body, headers);
        org.springframework.http.ResponseEntity<java.util.Map<String, Object>> response = restTemplate.postForEntity(TASK_URL, request, (Class<java.util.Map<String, Object>>) (Class<?>) java.util.Map.class);
        if (logFilename != null) logger.logToFile(logFilename, "HeyGen task response: " + response.getBody());
        
        // Debug: Log the full response to see its structure
        log.info("[HeyGenService] Full HeyGen API response: {}", response.getBody());
       
        // Extract duration_ms and task_id from response
        Map<String, Object> result = new HashMap<>();
        if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
            Map<String, Object> data = (Map<String, Object>) response.getBody().get("data");
            if (data != null) {
                result.put("duration_ms", data.get("duration_ms"));
                result.put("task_id", data.get("task_id"));
                log.info("[HeyGenService] Task duration: {}ms, task_id: {}", data.get("duration_ms"), data.get("task_id"));
            }
        }
        
      
        long stepEnd = System.currentTimeMillis();
        if (logFilename != null) logger.logToFile(logFilename, "HeyGenService.sendTaskToHeyGen duration: " + (stepEnd - stepStart) + " ms");
      
      return result;
    }

    // Overload for backward compatibility
    public void sendTaskToHeyGen(String sessionId, String text, String taskType) {
        sendTaskToHeyGen(sessionId, text, taskType, null);
    }

    public void stopSession(String sessionId) {
        RestTemplate restTemplate = new RestTemplate();
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("x-api-key", apiKey);
        Map<String, Object> body = new HashMap<>();
        body.put("session_id", sessionId);
        HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);
        try {
            // Call the HeyGen API to stop the session (correct endpoint)
            log.info("[HeyGenService] Stopping session {} via /v1/streaming.stop", sessionId);
            ResponseEntity<Map> response = restTemplate.postForEntity("https://api.heygen.com/v1/streaming.stop", request, Map.class);
            log.info("[HeyGenService] Stop session response: {}", response.getBody());
        } catch (Exception e) {
            log.warn("[HeyGenService] Error stopping session {}: {}", sessionId, e.getMessage());
            // Don't throw exception for stop failures as session might already be closed
        }
    }

    public void keepSessionAlive(String sessionId) {
        RestTemplate restTemplate = new RestTemplate();
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("x-api-key", apiKey);
        Map<String, Object> body = new HashMap<>();
        body.put("session_id", sessionId);
        HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);
        try {
            log.info("[HeyGenService] Sending keep-alive for session {} via /v1/streaming.keep_alive", sessionId);
            ResponseEntity<Map> response = restTemplate.postForEntity("https://api.heygen.com/v1/streaming.keep_alive", request, Map.class);
            log.info("[HeyGenService] Keep-alive response: {}", response.getBody());
        } catch (Exception e) {
            log.error("[HeyGenService] Error sending keep-alive for session {}: {}", sessionId, e.getMessage());
            throw new RuntimeException("Failed to send keep-alive: " + e.getMessage());
        }
    }

    public String getApiKey() {
        return apiKey;
    }

    public String getAvatarDefaultVoice(String avatarId) {
        String url = "https://api.heygen.com/v1/streaming/avatar.list";
        RestTemplate restTemplate = new RestTemplate();
        HttpHeaders headers = new HttpHeaders();
        headers.set("x-api-key", apiKey);
        HttpEntity<Void> request = new HttpEntity<>(headers);
        try {
            ResponseEntity<Map> response = restTemplate.exchange(url, HttpMethod.GET, request, Map.class);
            Map<String, Object> body = response.getBody();
            if (body != null && body.containsKey("data")) {
                Object dataObj = body.get("data");
                if (dataObj instanceof java.util.List) {
                    java.util.List<Map<String, Object>> avatars = (java.util.List<Map<String, Object>>) dataObj;
                    for (Map<String, Object> avatar : avatars) {
                        String currentAvatarId = (String) avatar.get("avatar_id");
                        if (avatarId.equals(currentAvatarId)) {
                            String defaultVoice = (String) avatar.get("default_voice");
                            log.info("Found default voice for avatar {}: {}", avatarId, defaultVoice);
                            return defaultVoice;
                        }
                    }
                }
            }
            log.warn("Could not find default voice for avatar: {}", avatarId);
            return null;
        } catch (Exception e) {
            log.error("Error fetching avatar default voice for {}: {}", avatarId, e.getMessage());
            return null;
        }
    }

    public Map<String, Object> getPublicInteractiveAvatars() {
        String url = "https://api.heygen.com/v1/streaming/avatar.list";
        RestTemplate restTemplate = new RestTemplate();
        HttpHeaders headers = new HttpHeaders();
        headers.set("x-api-key", apiKey);
        HttpEntity<Void> request = new HttpEntity<>(headers);
        Map<String, Object> result = new HashMap<>();
        try {
            ResponseEntity<Map> response = restTemplate.exchange(url, HttpMethod.GET, request, Map.class);
            Map<String, Object> body = response.getBody();
            if (body != null && body.containsKey("data")) {
                Object dataObj = body.get("data");
                if (dataObj instanceof java.util.List) {
                    java.util.List<Map<String, Object>> avatars = (java.util.List<Map<String, Object>>) dataObj;
                    java.util.List<Map<String, Object>> filtered = new java.util.ArrayList<>();
                    for (Map<String, Object> avatar : avatars) {
                        Boolean isPublic = Boolean.TRUE.equals(avatar.get("is_public"));
                        String status = (String) avatar.get("status");
                        if (isPublic && "ACTIVE".equalsIgnoreCase(status)) {
                            Map<String, Object> avatarInfo = new HashMap<>();
                            avatarInfo.put("id", avatar.get("avatar_id"));
                            avatarInfo.put("preview_image_url", avatar.get("normal_preview"));
                            avatarInfo.put("default_voice", avatar.get("default_voice"));
                            avatarInfo.put("gender", avatar.getOrDefault("gender", null));
                            filtered.add(avatarInfo);
                        }
                    }
                    result.put("avatars", filtered);
                    return result;
                }
            }
            result.put("avatars", new java.util.ArrayList<>());
            return result;
        } catch (Exception e) {
            result.put("avatars", new java.util.ArrayList<>());
            result.put("error", e.getMessage());
            return result;
        }
    }
} 