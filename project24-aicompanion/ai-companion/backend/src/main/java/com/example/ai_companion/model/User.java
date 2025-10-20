package com.example.ai_companion.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.data.mongodb.core.index.Indexed;

import java.util.List;
import java.util.ArrayList;
import java.util.Collection;

/**
 * Represents a user in the system with roles and profile information.
 * Implements Spring Security's UserDetails for authentication and authorization
 * purposes.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "users")
public class User implements UserDetails {

    /**
     * Enum representing user roles within the application.
     */
    public enum Role {
        NONE,
        ELDERLY,
        CAREGIVER
    }

    /**
     * Represents the profile flow status for a user.
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ProfileFlowStatus {
        private Integer currentStep;
        private Integer highestStepReached;
        private Boolean step1Completed;
        private Boolean step2Completed;
        private Boolean step3Completed;
        private Boolean flowCompleted;
        private Boolean hasConnections;
    }

    @Id
    private String id;

    @Indexed(unique = true)
    private String firebaseUid;

    @Indexed(unique = true)
    private String email;

    private String address;

    @Indexed(unique = true)
    private String phoneNumber;

    private String fullName;

    private String dateOfBirth;

    private String profileImageUrl;

    private String coreInformation;

    private Role role;

    // Additional profile fields
    private String bloodType = "N/A";
    private String gender = "N/A";
    // ElderlyStage2 fields
    private String dailyLife;
    private String relationships;
    private String medicalNeeds;
    private String hobbies;
    private String anythingElse;

    // For elderly users: list of caregiver user IDs they are linked to
    private List<String> caregiverIds = new ArrayList<>();

    // For caregivers: list of elderly user IDs they are linked to
    private List<String> elderlyUserIds = new ArrayList<>();

    private List<String> favoriteCaregiverIds = new ArrayList<>();
    private List<String> favoriteElderlyIds = new ArrayList<>();

    // Profile flow tracking fields
    private Integer currentProfileStep = 1;
    private Integer highestStepReached = 1;
    private Boolean profileStep1Completed = false;
    private Boolean profileStep2Completed = false;
    private Boolean profileStep3Completed = false;
    private Boolean profileFlowCompleted = false;

    @Override
    public String getPassword() {
        return null;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        if (role == null || role == Role.NONE) {
            return List.of();
        }
        return List.of(new SimpleGrantedAuthority("ROLE_" + role.name()));
    }

    @Override
    public String getUsername() {
        return firebaseUid;
    }


}
