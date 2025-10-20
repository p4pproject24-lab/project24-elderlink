package com.example.ai_companion.dto;
import lombok.Data;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

@Data
public class UserDTO {

    @NotBlank
    private String fullName;

    @NotBlank
    private String address;

    private String email;

    @NotBlank
    private String phoneNumber;

    @NotNull
    private String dateOfBirth;

    @NotBlank
    private String role; // 'elderly' or 'caregiver'

    private String profileImageUrl;

    private String bloodType;
    private String gender;
    
    // ElderlyStage2 fields
    private String dailyLife;
    private String relationships;
    private String medicalNeeds;
    private String hobbies;
    private String anythingElse;
}