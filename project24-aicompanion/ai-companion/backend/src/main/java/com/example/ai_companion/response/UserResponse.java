package com.example.ai_companion.response;

import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * A DTO representing the user information returned to clients.
 * This excludes sensitive data like passwords and internal IDs.
 */
@Data
@NoArgsConstructor
public class UserResponse {
    private String fullName;
    private String email;
    private String phoneNumber;
    private String dateOfBirth;
    private String role;
    private String profileImageUrl;
    private String address;
    private String id;
    private String firebaseUid;
    private String bloodType;
    private String gender;
    private String coreInformation;
    // ElderlyStage2 fields
    private String dailyLife;
    private String relationships;
    private String medicalNeeds;
    private String hobbies;
    private String anythingElse;
}
