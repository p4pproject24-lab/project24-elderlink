package com.example.ai_companion.controller;

import com.example.ai_companion.service.MemoryService;
import com.example.ai_companion.utils.ApiResponseBuilder;
import com.example.ai_companion.utils.logger;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import com.example.ai_companion.model.User;

import java.util.Map;
import java.util.HashMap;

@RestController
@RequestMapping("/memory")
public class MemoryController {

    @Autowired
    private MemoryService memoryService;

    /**
     * Manually add core information to user's profile
     */
    @PostMapping("/add-core")
    public ResponseEntity<?> addCoreInformation(Authentication authentication, @RequestBody Map<String, String> payload) {
        try {
            User user = (User) authentication.getPrincipal();
            String coreInfo = payload.get("coreInformation");
            
            if (coreInfo == null || coreInfo.trim().isEmpty()) {
                return ApiResponseBuilder.build(HttpStatus.BAD_REQUEST, "Core information cannot be empty");
            }

            logger.logToFile(user.getFirebaseUid(), "Manual core information addition: " + coreInfo);
            memoryService.addManualCoreInformation(user.getFirebaseUid(), coreInfo.trim());
            
            return ApiResponseBuilder.build(HttpStatus.OK, "Core information added successfully");
        } catch (Exception e) {
            logger.logToFile("system", "Error adding core information: " + e.getMessage());
            return ApiResponseBuilder.build(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to add core information: " + e.getMessage());
        }
    }

    /**
     * Manually add contextual memory to user's memory store
     */
    @PostMapping("/add-contextual")
    public ResponseEntity<?> addContextualMemory(Authentication authentication, @RequestBody Map<String, String> payload) {
        try {
            User user = (User) authentication.getPrincipal();
            String contextualMemory = payload.get("contextualMemory");
            
            if (contextualMemory == null || contextualMemory.trim().isEmpty()) {
                return ApiResponseBuilder.build(HttpStatus.BAD_REQUEST, "Contextual memory cannot be empty");
            }

            logger.logToFile(user.getFirebaseUid(), "Manual contextual memory addition: " + contextualMemory);
            memoryService.addManualContextualMemory(user.getFirebaseUid(), contextualMemory.trim());
            
            return ApiResponseBuilder.build(HttpStatus.OK, "Contextual memory added successfully");
        } catch (Exception e) {
            logger.logToFile("system", "Error adding contextual memory: " + e.getMessage());
            return ApiResponseBuilder.build(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to add contextual memory: " + e.getMessage());
        }
    }

    /**
     * Get user's current core information
     */
    @GetMapping("/core-information")
    public ResponseEntity<?> getCoreInformation(Authentication authentication) {
        try {
            User user = (User) authentication.getPrincipal();
            String coreInfo = memoryService.getUserCoreInformation(user.getFirebaseUid());
            
            Map<String, Object> response = new HashMap<>();
            response.put("coreInformation", coreInfo);
            
            return ApiResponseBuilder.build(HttpStatus.OK, "Core information retrieved successfully", response);
        } catch (Exception e) {
            logger.logToFile("system", "Error retrieving core information: " + e.getMessage());
            return ApiResponseBuilder.build(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to retrieve core information: " + e.getMessage());
        }
    }
}
