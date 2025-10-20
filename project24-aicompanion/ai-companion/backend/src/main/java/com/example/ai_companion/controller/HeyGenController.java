package com.example.ai_companion.controller;

import com.example.ai_companion.dto.HeyGenSessionRequest;
import com.example.ai_companion.dto.HeyGenStartSessionRequest;
import com.example.ai_companion.service.HeyGenService;
import com.example.ai_companion.response.HeyGenSessionResponse;
import com.example.ai_companion.utils.ApiResponseBuilder;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import java.util.HashMap;
import org.springframework.http.HttpEntity;
import org.springframework.security.core.Authentication;
import com.example.ai_companion.model.User;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@RestController
@RequestMapping("/heygen")
public class HeyGenController {

    private static final Logger logger = LoggerFactory.getLogger(HeyGenController.class);

    @Autowired
    private HeyGenService heyGenService;

    @GetMapping("/session-token")
    public ResponseEntity<?> getSessionToken() {
        String token = heyGenService.createSessionToken();
        return ApiResponseBuilder.build(HttpStatus.OK, "Session token created", token);
    }



    @PostMapping("/create-session")
    public ResponseEntity<?> createSession(@RequestBody HeyGenSessionRequest request) {
        logger.info("[HeyGenController] Received session request: {}", request);
        logger.info("[HeyGenController] Voice settings: {}", request.getVoice());
        HeyGenSessionResponse sessionInfo = heyGenService.createSession(request);
        return ApiResponseBuilder.build(HttpStatus.OK, "Session created", sessionInfo);
    }

    @PostMapping("/start-session")
    public ResponseEntity<?> startSession(Authentication authentication, @RequestBody HeyGenStartSessionRequest request) {
        User user = (User) authentication.getPrincipal();
        String firebaseUid = user.getFirebaseUid();
        logger.info("[HeyGenController] Starting session for user: {}, sessionId: {}", firebaseUid, request.getSessionId());
        HeyGenSessionResponse startInfo = heyGenService.startSession(firebaseUid, request);
        return ApiResponseBuilder.build(HttpStatus.OK, "Session started", startInfo);
    }

    // New endpoint for sending text to avatar (talk or repeat)
    @PostMapping("/task")
    public ResponseEntity<?> sendTask(@RequestBody Map<String, String> payload) {
        String sessionId = payload.get("sessionId");
        String text = payload.get("text");
        String taskType = payload.getOrDefault("taskType", "talk");
        Map<String, Object> taskResult = heyGenService.sendTaskToHeyGen(sessionId, text, taskType, null);
        return ApiResponseBuilder.build(HttpStatus.OK, "Task sent to avatar", taskResult);
    }

    @PostMapping("/stop-session")
    public ResponseEntity<?> stopSession(@RequestBody Map<String, String> payload) {
        String sessionId = payload.get("sessionId");
        heyGenService.stopSession(sessionId);
        return com.example.ai_companion.utils.ApiResponseBuilder.build(org.springframework.http.HttpStatus.OK, "Session stopped");
    }

    @GetMapping("/avatar-details")
    public ResponseEntity<?> getAvatarDetails(@RequestParam String avatarId) {
        String url = "https://api.heygen.com/v2/avatar/" + avatarId + "/details";
        RestTemplate restTemplate = new RestTemplate();
        HttpHeaders headers = new HttpHeaders();
        headers.set("x-api-key", heyGenService.getApiKey());
        HttpEntity<Void> request = new HttpEntity<>(headers);
        try {
            ResponseEntity<Map> response = restTemplate.exchange(url, HttpMethod.GET, request, Map.class);
            Map<String, Object> body = response.getBody();
            String previewImageUrl = null;
            if (body != null && body.containsKey("data")) {
                Object dataObj = body.get("data");
                if (dataObj instanceof Map) {
                    Map data = (Map) dataObj;
                    Object preview = data.get("preview_image_url");
                    if (preview instanceof String) {
                        previewImageUrl = (String) preview;
                    }
                }
            }
            Map<String, Object> result = new HashMap<>();
            result.put("previewImageUrl", previewImageUrl);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            Map<String, Object> result = new HashMap<>();
            result.put("previewImageUrl", null);
            result.put("error", e.getMessage());
            return ResponseEntity.status(500).body(result);
        }
    }

    @GetMapping("/avatar-list")
    public ResponseEntity<?> getAvatarList() {
        Map<String, Object> result = heyGenService.getPublicInteractiveAvatars();
        return ResponseEntity.ok(result);
    }
} 