package com.example.ai_companion.controller;

import com.example.ai_companion.dto.UserDTO;
// import com.example.ai_companion.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.example.ai_companion.model.User;
import com.example.ai_companion.response.UserResponse;
import com.example.ai_companion.utils.ApiResponseBuilder;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import java.util.Map;
import com.example.ai_companion.repository.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseToken;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private final UserRepository userRepository;

    public AuthController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(Authentication authentication, HttpServletRequest request) {
        try {
            User user = null;
            
            // First try to get user from authentication (if Firebase filter worked)
            if (authentication != null && authentication.getPrincipal() instanceof User) {
                user = (User) authentication.getPrincipal();
            } else {
                // Fallback: Extract Firebase UID from Authorization header
                String authHeader = request.getHeader("Authorization");
                if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                    return ApiResponseBuilder.build(HttpStatus.BAD_REQUEST, "Missing or invalid Authorization header");
                }
                
                String token = authHeader.substring(7);
                
                // Verify the Firebase token and extract UID
                FirebaseToken decodedToken = FirebaseAuth.getInstance().verifyIdToken(token);
                String firebaseUid = decodedToken.getUid();
                
                // Find user by Firebase UID
                user = userRepository.findByFirebaseUid(firebaseUid);
                
                if (user == null) {
                    // Create a new user from Firebase token data
                    user = new User();
                    user.setFirebaseUid(firebaseUid);
                    user.setEmail(decodedToken.getEmail());
                    user.setFullName(decodedToken.getName());
                    user.setProfileImageUrl(decodedToken.getPicture());
                    user.setRole(User.Role.NONE); // Default role, user can update later
                    userRepository.save(user);
                }
            }
            
            UserResponse userResponse = new UserResponse();
            userResponse.setFullName(user.getFullName());
            userResponse.setEmail(user.getEmail());
            userResponse.setPhoneNumber(user.getPhoneNumber());
            userResponse.setDateOfBirth(user.getDateOfBirth());
            userResponse.setRole(user.getRole() != null ? user.getRole().name() : null);
            userResponse.setProfileImageUrl(user.getProfileImageUrl());
            userResponse.setAddress(user.getAddress());
            userResponse.setFirebaseUid(user.getFirebaseUid());
            userResponse.setId(user.getId());
            userResponse.setBloodType(user.getBloodType());
            userResponse.setGender(user.getGender());
            userResponse.setCoreInformation(user.getCoreInformation());
            // ElderlyStage2 fields
            userResponse.setDailyLife(user.getDailyLife());
            userResponse.setRelationships(user.getRelationships());
            userResponse.setMedicalNeeds(user.getMedicalNeeds());
            userResponse.setHobbies(user.getHobbies());
            userResponse.setAnythingElse(user.getAnythingElse());
            return ApiResponseBuilder.build(HttpStatus.OK, "User fetched successfully", userResponse);
            
        } catch (Exception e) {
            return ApiResponseBuilder.build(HttpStatus.UNAUTHORIZED, "Invalid token: " + e.getMessage());
        }
    }

    @PutMapping("/role")
    public ResponseEntity<?> updateRole(Authentication authentication, HttpServletRequest request, @RequestBody Map<String, String> payload) {
        try {
            User user = null;
            
            // First try to get user from authentication (if Firebase filter worked)
            if (authentication != null && authentication.getPrincipal() instanceof User) {
                user = (User) authentication.getPrincipal();
            } else {
                // Fallback: Extract Firebase UID from Authorization header
                String authHeader = request.getHeader("Authorization");
                if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                    return ApiResponseBuilder.build(HttpStatus.BAD_REQUEST, "Missing or invalid Authorization header");
                }
                
                String token = authHeader.substring(7);
                
                // Verify the Firebase token and extract UID
                FirebaseToken decodedToken = FirebaseAuth.getInstance().verifyIdToken(token);
                String firebaseUid = decodedToken.getUid();
                
                // Find user by Firebase UID
                user = userRepository.findByFirebaseUid(firebaseUid);
                if (user == null) {
                    return ApiResponseBuilder.build(HttpStatus.NOT_FOUND, "User not found");
                }
            }
            
            String newRole = payload.get("role");
            if (newRole == null || (!newRole.equals("ELDERLY") && !newRole.equals("CAREGIVER"))) {
                return ApiResponseBuilder.build(HttpStatus.BAD_REQUEST, "Invalid role. Must be 'ELDERLY' or 'CAREGIVER'.");
            }
            user.setRole(User.Role.valueOf(newRole));
            userRepository.save(user);
            return ResponseEntity.noContent().build();
            
        } catch (Exception e) {
            return ApiResponseBuilder.build(HttpStatus.UNAUTHORIZED, "Invalid token: " + e.getMessage());
        }
    }
}