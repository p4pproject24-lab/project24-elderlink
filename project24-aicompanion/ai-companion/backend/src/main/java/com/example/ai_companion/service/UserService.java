package com.example.ai_companion.service;

import com.example.ai_companion.dto.UserDTO;
import com.example.ai_companion.model.User;
import com.example.ai_companion.repository.UserRepository;
import com.example.ai_companion.response.ApiResponse;
import com.example.ai_companion.response.UserResponse;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import com.example.ai_companion.exception.UserProfileValidationException;

import java.util.regex.Pattern;

@Service
public class UserService {
    private final UserRepository userRepository;
    private final ConnectionService connectionService;

    public UserService(UserRepository userRepository, ConnectionService connectionService) {
        this.userRepository = userRepository;
        this.connectionService = connectionService;
    }

    public void updateUserProfile(Authentication authentication, UserDTO userDTO) {
        if (authentication == null || !(authentication.getPrincipal() instanceof User)) {
            throw new UserProfileValidationException("User not authenticated");
        }
        User user = (User) authentication.getPrincipal();

        // Validation
        if (!isValidDate(userDTO.getDateOfBirth())) {
            throw new UserProfileValidationException("Date of birth must be in YYYY-MM-DD format");
        }
        if (!isValidPhone(userDTO.getPhoneNumber())) {
            throw new UserProfileValidationException("Invalid phone number format");
        }
        if (!StringUtils.hasText(userDTO.getFullName())) {
            throw new UserProfileValidationException("Full name is required");
        }
        if (!StringUtils.hasText(userDTO.getAddress())) {
            throw new UserProfileValidationException("Address is required");
        }

        // Update basic fields
        user.setFullName(userDTO.getFullName());
        user.setAddress(userDTO.getAddress());
        user.setDateOfBirth(userDTO.getDateOfBirth());
        user.setPhoneNumber(userDTO.getPhoneNumber());
        user.setProfileImageUrl(userDTO.getProfileImageUrl());
        
        // Update optional fields if provided
        if (userDTO.getBloodType() != null) {
            user.setBloodType(userDTO.getBloodType());
        }
        if (userDTO.getGender() != null) {
            user.setGender(userDTO.getGender());
        }

        // Mark step 1 as completed
        user.setProfileStep1Completed(true);
        user.setCurrentProfileStep(2);
        // Update ElderlyStage2 fields
        user.setDailyLife(userDTO.getDailyLife());
        user.setRelationships(userDTO.getRelationships());
        user.setMedicalNeeds(userDTO.getMedicalNeeds());
        user.setHobbies(userDTO.getHobbies());
        user.setAnythingElse(userDTO.getAnythingElse());
        
        // Build core information string from ElderlyStage2 fields
        if (user.getRole() == User.Role.ELDERLY) {
            StringBuilder coreInfo = new StringBuilder();
            if (StringUtils.hasText(userDTO.getDailyLife())) {
                coreInfo.append("Daily Life: ").append(userDTO.getDailyLife()).append(". ");
            }
            if (StringUtils.hasText(userDTO.getRelationships())) {
                coreInfo.append("Relationships: ").append(userDTO.getRelationships()).append(". ");
            }
            if (StringUtils.hasText(userDTO.getMedicalNeeds())) {
                coreInfo.append("Medical Needs: ").append(userDTO.getMedicalNeeds()).append(". ");
            }
            if (StringUtils.hasText(userDTO.getHobbies())) {
                coreInfo.append("Hobbies: ").append(userDTO.getHobbies()).append(". ");
            }
            if (StringUtils.hasText(userDTO.getAnythingElse())) {
                coreInfo.append("Additional Info: ").append(userDTO.getAnythingElse()).append(". ");
            }
            user.setCoreInformation(coreInfo.toString());
        }

        userRepository.save(user);
    }

    public boolean hasCompletedProfileSetup(String userId) {
        User user = userRepository.findById(userId).orElse(null);
        return user != null && user.getCoreInformation() != null && !user.getCoreInformation().trim().isEmpty();
    }

    public void updateProfileStep(Authentication authentication, Integer step) {
        if (authentication == null || !(authentication.getPrincipal() instanceof User)) {
            throw new UserProfileValidationException("User not authenticated");
        }
        User user = (User) authentication.getPrincipal();
        
        System.out.println("[UserService] Updating step from " + user.getCurrentProfileStep() + " to " + step + ", highest was " + user.getHighestStepReached());
        
        user.setCurrentProfileStep(step);
        
        // Update highest step reached if this is a new high
        if (step > user.getHighestStepReached()) {
            user.setHighestStepReached(step);
            System.out.println("[UserService] Updated highest step reached to " + step);
        }
        
        // Mark the appropriate step as completed
        if (step >= 2) {
            user.setProfileStep2Completed(true);
        }
        if (step >= 3) {
            user.setProfileStep3Completed(true);
        }
        
        // Mark profile flow as completed based on user role and final step
        if (user.getRole() == User.Role.CAREGIVER && step >= 2) {
            // Caregivers: Final step is 2 (Profile → Sync)
            user.setProfileFlowCompleted(true);
            System.out.println("[UserService] Caregiver profile flow completed at step " + step);
        } else if (user.getRole() == User.Role.ELDERLY && step >= 3) {
            // Elderly: Final step is 3 (Profile → Extra → Sync)
            user.setProfileFlowCompleted(true);
            System.out.println("[UserService] Elderly profile flow completed at step " + step);
        }
        
        userRepository.save(user);
    }

    public void goBackToStep(Authentication authentication, Integer step) {
        if (authentication == null || !(authentication.getPrincipal() instanceof User)) {
            throw new UserProfileValidationException("User not authenticated");
        }
        User user = (User) authentication.getPrincipal();
        
        System.out.println("[UserService] Going back to step " + step + " (highest remains " + user.getHighestStepReached() + ")");
        
        // Only update current step, don't change highest step reached
        user.setCurrentProfileStep(step);
        userRepository.save(user);
    }

    public void completeProfileFlow(Authentication authentication) {
        if (authentication == null || !(authentication.getPrincipal() instanceof User)) {
            throw new UserProfileValidationException("User not authenticated");
        }
        User user = (User) authentication.getPrincipal();
        
        System.out.println("[UserService] Manually completing profile flow for user " + user.getId() + " (role: " + user.getRole() + ")");
        user.setProfileFlowCompleted(true);
        userRepository.save(user);
    }

    public User.ProfileFlowStatus getProfileFlowStatus(Authentication authentication) {
        if (authentication == null || !(authentication.getPrincipal() instanceof User)) {
            throw new UserProfileValidationException("User not authenticated");
        }
        User user = (User) authentication.getPrincipal();
        
        // Check if user has any connections using the updated method
        boolean userHasConnections = hasConnections(user);
        
        System.out.println("[UserService] Profile flow status - current: " + user.getCurrentProfileStep() + 
                         ", highest: " + user.getHighestStepReached() + 
                         ", hasConnections: " + userHasConnections + 
                         ", firebaseUid: " + user.getFirebaseUid());
        
        return new User.ProfileFlowStatus(
            user.getCurrentProfileStep(),
            user.getHighestStepReached(),
            user.getProfileStep1Completed(),
            user.getProfileStep2Completed(),
            user.getProfileStep3Completed(),
            user.getProfileFlowCompleted(),
            userHasConnections
        );
    }

    public boolean shouldShowProfileFlow(Authentication authentication) {
        if (authentication == null || !(authentication.getPrincipal() instanceof User)) {
            return false;
        }
        User user = (User) authentication.getPrincipal();
        
        // If profile flow is completed and user has connections, don't show profile flow
        if (user.getProfileFlowCompleted() && hasConnections(user)) {
            return false;
        }
        
        // If any step is not completed, show profile flow
        if (!user.getProfileStep1Completed()) {
            return true;
        }
        
        // For elderly users, step 2 is optional but step 3 is required
        if (user.getRole() == User.Role.ELDERLY) {
            if (!user.getProfileStep3Completed()) {
                return true;
            }
        }
        
        // For caregivers, step 2 is required
        if (user.getRole() == User.Role.CAREGIVER) {
            if (!user.getProfileStep2Completed()) {
                return true;
            }
        }
        
        // If all required steps are completed but no connections, show sync step
        if (!hasConnections(user)) {
            return true;
        }
        
        return false;
    }

    private boolean hasConnections(User user) {
        // First check the User model's stored connection lists
        boolean hasStoredConnections = false;
        if (user.getRole() == User.Role.ELDERLY) {
            hasStoredConnections = !user.getCaregiverIds().isEmpty();
        } else if (user.getRole() == User.Role.CAREGIVER) {
            hasStoredConnections = !user.getElderlyUserIds().isEmpty();
        }
        
        // Also check the ConnectionService for consistency
        boolean hasServiceConnections = false;
        if (user.getRole() == User.Role.ELDERLY) {
            hasServiceConnections = !connectionService.getConnectedCaregiversForElderly(user.getFirebaseUid()).isEmpty();
        } else if (user.getRole() == User.Role.CAREGIVER) {
            hasServiceConnections = !connectionService.getConnectedElderlyForCaregiver(user.getFirebaseUid()).isEmpty();
        }
        
        // Return true if either source indicates connections exist
        boolean hasConnections = hasStoredConnections || hasServiceConnections;
        
        // Log for debugging if there's a mismatch
        if (hasStoredConnections != hasServiceConnections) {
            System.out.println("[UserService] Connection mismatch for user " + user.getFirebaseUid() + 
                             " (role: " + user.getRole() + "): stored=" + hasStoredConnections + 
                             ", service=" + hasServiceConnections);
        }
        
        return hasConnections;
    }

    public java.util.Map<String, java.util.List<String>> getFavorites(String userId) {
        System.out.println("[UserService] getFavorites called with userId: " + userId);
        User user = userRepository.findByFirebaseUid(userId);
        if (user == null) {
            System.out.println("[UserService] User not found for firebaseUid: " + userId);
            return java.util.Map.of();
        }
        System.out.println("[UserService] Found user: id=" + user.getId() + ", firebaseUid=" + user.getFirebaseUid() + ", role=" + user.getRole());
        java.util.Map<String, java.util.List<String>> result = java.util.Map.of(
            "favoriteCaregiverIds", user.getFavoriteCaregiverIds(),
            "favoriteElderlyIds", user.getFavoriteElderlyIds()
        );
        System.out.println("[UserService] Returning favorites for user " + userId + ": " + result);
        return result;
    }

    public java.util.Map<String, java.util.List<String>> toggleFavorite(String userId, String targetUserId, String type) {
        System.out.println("[UserService] toggleFavorite called with userId: " + userId + ", targetUserId: " + targetUserId + ", type: " + type);
        User user = userRepository.findByFirebaseUid(userId);
        if (user == null) {
            System.out.println("[UserService] User not found for userId: " + userId);
            return java.util.Map.of();
        }
        if ("caregiver".equals(type)) {
            java.util.List<String> favs = user.getFavoriteCaregiverIds();
            if (favs.contains(targetUserId)) {
                favs.remove(targetUserId);
                System.out.println("[UserService] Removed caregiver " + targetUserId + " from favorites");
            } else if (favs.size() < 2) {
                favs.add(targetUserId);
                System.out.println("[UserService] Added caregiver " + targetUserId + " to favorites");
            }
            user.setFavoriteCaregiverIds(favs);
        } else if ("elderly".equals(type)) {
            java.util.List<String> favs = user.getFavoriteElderlyIds();
            if (favs.contains(targetUserId)) {
                favs.remove(targetUserId);
                System.out.println("[UserService] Removed elderly " + targetUserId + " from favorites");
            } else if (favs.size() < 2) {
                favs.add(targetUserId);
                System.out.println("[UserService] Added elderly " + targetUserId + " to favorites");
            }
            user.setFavoriteElderlyIds(favs);
        }
        userRepository.save(user);
        return getFavorites(userId);
    }

    private boolean isValidDate(String date) {
        return date != null && date.matches("\\d{4}-\\d{2}-\\d{2}");
    }

    private boolean isValidPhone(String phone) {
        return phone != null && Pattern.matches("^[0-9+\\-() ]{7,20}$", phone);
    }
} 