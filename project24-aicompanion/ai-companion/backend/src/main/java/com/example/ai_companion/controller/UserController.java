package com.example.ai_companion.controller;

import com.example.ai_companion.dto.UserDTO;
import com.example.ai_companion.response.UserResponse;
import com.example.ai_companion.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/users")
public class UserController {
    private final UserService userService;

    @Autowired
    public UserController(UserService userService) {
        this.userService = userService;
    }

    @PutMapping("/profile")
    public ResponseEntity<?> updateProfile(Authentication authentication, @RequestBody UserDTO userDTO) {
        userService.updateUserProfile(authentication, userDTO);
        return com.example.ai_companion.utils.ApiResponseBuilder.build(org.springframework.http.HttpStatus.OK, "Profile updated successfully");
    }

    @GetMapping("/profile-flow/status")
    public ResponseEntity<?> getProfileFlowStatus(Authentication authentication) {
        return ResponseEntity.ok(userService.getProfileFlowStatus(authentication));
    }

    @PutMapping("/profile-flow/step")
    public ResponseEntity<?> updateProfileStep(Authentication authentication, @RequestParam Integer step) {
        userService.updateProfileStep(authentication, step);
        return com.example.ai_companion.utils.ApiResponseBuilder.build(org.springframework.http.HttpStatus.OK, "Profile step updated successfully");
    }

    @PutMapping("/profile-flow/step/back")
    public ResponseEntity<?> goBackToStep(Authentication authentication, @RequestParam Integer step) {
        userService.goBackToStep(authentication, step);
        return com.example.ai_companion.utils.ApiResponseBuilder.build(org.springframework.http.HttpStatus.OK, "Profile step updated successfully");
    }

    @PostMapping("/profile-flow/complete")
    public ResponseEntity<?> completeProfileFlow(Authentication authentication) {
        userService.completeProfileFlow(authentication);
        return com.example.ai_companion.utils.ApiResponseBuilder.build(org.springframework.http.HttpStatus.OK, "Profile flow completed successfully");
    }

    @GetMapping("/profile-flow/should-show")
    public ResponseEntity<?> shouldShowProfileFlow(Authentication authentication) {
        boolean shouldShow = userService.shouldShowProfileFlow(authentication);
        return ResponseEntity.ok(java.util.Map.of("shouldShow", shouldShow));
    }

    @GetMapping("/favorites")
    public ResponseEntity<?> getFavorites(@RequestParam String userId) {
        System.out.println("[UserController] getFavorites called with userId: " + userId);
        java.util.Map<String, java.util.List<String>> result = userService.getFavorites(userId);
        System.out.println("[UserController] Returning favorites: " + result);
        return ResponseEntity.ok(result);
    }

    @PostMapping("/favorites/toggle")
    public ResponseEntity<?> toggleFavorite(
        @RequestParam String userId,
        @RequestParam String targetUserId,
        @RequestParam String type // "caregiver" or "elderly"
    ) {
        System.out.println("[UserController] toggleFavorite called with userId: " + userId + ", targetUserId: " + targetUserId + ", type: " + type);
        java.util.Map<String, java.util.List<String>> result = userService.toggleFavorite(userId, targetUserId, type);
        System.out.println("[UserController] Returning updated favorites: " + result);
        return ResponseEntity.ok(result);
    }
}