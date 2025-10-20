package com.example.ai_companion.service;

import com.example.ai_companion.model.User;
import com.example.ai_companion.repository.UserRepository;
import com.google.firebase.auth.FirebaseToken;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

import java.util.HashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CustomUserDetailsServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private FirebaseToken firebaseToken;

    @InjectMocks
    private CustomUserDetailsService customUserDetailsService;

    private User testUser;
    private String testFirebaseUid;
    private String testEmail;
    private String testPhone;
    private String testName;
    private String testPicture;

    @BeforeEach
    void setUp() {
        testFirebaseUid = "test-firebase-uid";
        testEmail = "test@example.com";
        testPhone = "+1234567890";
        testName = "Test User";
        testPicture = "https://example.com/picture.jpg";

        testUser = new User();
        testUser.setId("user-id-123");
        testUser.setFirebaseUid(testFirebaseUid);
        testUser.setEmail(testEmail);
        testUser.setPhoneNumber(testPhone);
        testUser.setFullName(testName);
        testUser.setProfileImageUrl(testPicture);
        testUser.setRole(User.Role.ELDERLY);
    }

    @Test
    void loadUserByUsername_WithValidFirebaseUid_ShouldReturnUser() {
        // Arrange
        when(userRepository.findByFirebaseUid(testFirebaseUid)).thenReturn(testUser);

        // Act
        UserDetails result = customUserDetailsService.loadUserByUsername(testFirebaseUid);

        // Assert
        assertNotNull(result);
        assertEquals(testUser, result);
        verify(userRepository).findByFirebaseUid(testFirebaseUid);
    }

    @Test
    void loadUserByUsername_WithNullUser_ShouldThrowException() {
        // Arrange
        when(userRepository.findByFirebaseUid(testFirebaseUid)).thenReturn(null);

        // Act & Assert
        UsernameNotFoundException exception = assertThrows(UsernameNotFoundException.class, () -> {
            customUserDetailsService.loadUserByUsername(testFirebaseUid);
        });

        assertEquals("User not found with firebaseUid: " + testFirebaseUid, exception.getMessage());
        verify(userRepository).findByFirebaseUid(testFirebaseUid);
    }

    @Test
    void loadUserByUsername_WithEmptyFirebaseUid_ShouldThrowException() {
        // Arrange
        when(userRepository.findByFirebaseUid("")).thenReturn(null);

        // Act & Assert
        UsernameNotFoundException exception = assertThrows(UsernameNotFoundException.class, () -> {
            customUserDetailsService.loadUserByUsername("");
        });

        assertEquals("User not found with firebaseUid: ", exception.getMessage());
        verify(userRepository).findByFirebaseUid("");
    }

    @Test
    void loadUserByUsername_WithNullFirebaseUid_ShouldThrowException() {
        // Arrange
        when(userRepository.findByFirebaseUid(null)).thenReturn(null);

        // Act & Assert
        UsernameNotFoundException exception = assertThrows(UsernameNotFoundException.class, () -> {
            customUserDetailsService.loadUserByUsername(null);
        });

        assertEquals("User not found with firebaseUid: null", exception.getMessage());
        verify(userRepository).findByFirebaseUid(null);
    }

    @Test
    void createOrUpdateUserFromFirebaseToken_WithExistingUserByUid_ShouldReturnExistingUser() {
        // Arrange
        when(firebaseToken.getUid()).thenReturn(testFirebaseUid);
        when(userRepository.findByFirebaseUid(testFirebaseUid)).thenReturn(testUser);

        // Act
        User result = customUserDetailsService.createOrUpdateUserFromFirebaseToken(firebaseToken);

        // Assert
        assertNotNull(result);
        assertEquals(testUser, result);
        verify(userRepository).findByFirebaseUid(testFirebaseUid);
        verify(userRepository, never()).findByEmail(anyString());
        verify(userRepository, never()).findByPhoneNumber(anyString());
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void createOrUpdateUserFromFirebaseToken_WithExistingUserByEmail_ShouldUpdateAndReturnUser() {
        // Arrange
        when(firebaseToken.getUid()).thenReturn(testFirebaseUid);
        when(firebaseToken.getEmail()).thenReturn(testEmail);
        when(userRepository.findByFirebaseUid(testFirebaseUid)).thenReturn(null);
        when(userRepository.findByEmail(testEmail)).thenReturn(testUser);
        when(userRepository.save(testUser)).thenReturn(testUser);

        // Act
        User result = customUserDetailsService.createOrUpdateUserFromFirebaseToken(firebaseToken);

        // Assert
        assertNotNull(result);
        assertEquals(testUser, result);
        assertEquals(testFirebaseUid, testUser.getFirebaseUid());
        verify(userRepository).findByFirebaseUid(testFirebaseUid);
        verify(userRepository).findByEmail(testEmail);
        verify(userRepository).save(testUser);
        verify(userRepository, never()).findByPhoneNumber(anyString());
    }

    @Test
    void createOrUpdateUserFromFirebaseToken_WithExistingUserByPhone_ShouldUpdateAndReturnUser() {
        // Arrange
        when(firebaseToken.getUid()).thenReturn(testFirebaseUid);
        when(firebaseToken.getEmail()).thenReturn(null);
        when(firebaseToken.getClaims()).thenReturn(createClaimsWithPhone(testPhone));
        when(userRepository.findByFirebaseUid(testFirebaseUid)).thenReturn(null);
        when(userRepository.findByPhoneNumber(testPhone)).thenReturn(testUser);
        when(userRepository.save(testUser)).thenReturn(testUser);

        // Act
        User result = customUserDetailsService.createOrUpdateUserFromFirebaseToken(firebaseToken);

        // Assert
        assertNotNull(result);
        assertEquals(testUser, result);
        assertEquals(testFirebaseUid, testUser.getFirebaseUid());
        verify(userRepository).findByFirebaseUid(testFirebaseUid);
        verify(userRepository, never()).findByEmail(anyString());
        verify(userRepository).findByPhoneNumber(testPhone);
        verify(userRepository).save(testUser);
    }

    @Test
    void createOrUpdateUserFromFirebaseToken_WithNewUser_ShouldCreateAndReturnUser() {
        // Arrange
        when(firebaseToken.getUid()).thenReturn(testFirebaseUid);
        when(firebaseToken.getEmail()).thenReturn(testEmail);
        when(firebaseToken.getName()).thenReturn(testName);
        when(firebaseToken.getPicture()).thenReturn(testPicture);
        when(firebaseToken.getClaims()).thenReturn(createClaimsWithPhone(testPhone));
        when(userRepository.findByFirebaseUid(testFirebaseUid)).thenReturn(null);
        when(userRepository.findByEmail(testEmail)).thenReturn(null);
        when(userRepository.findByPhoneNumber(testPhone)).thenReturn(null);
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User user = invocation.getArgument(0);
            user.setId("new-user-id");
            return user;
        });

        // Act
        User result = customUserDetailsService.createOrUpdateUserFromFirebaseToken(firebaseToken);

        // Assert
        assertNotNull(result);
        assertEquals(testFirebaseUid, result.getFirebaseUid());
        assertEquals(testEmail, result.getEmail());
        assertEquals(testPhone, result.getPhoneNumber());
        assertEquals(testName, result.getFullName());
        assertEquals(testPicture, result.getProfileImageUrl());
        assertEquals(User.Role.NONE, result.getRole());
        verify(userRepository).findByFirebaseUid(testFirebaseUid);
        verify(userRepository).findByEmail(testEmail);
        verify(userRepository).findByPhoneNumber(testPhone);
        verify(userRepository).save(any(User.class));
    }

    @Test
    void createOrUpdateUserFromFirebaseToken_WithNullEmail_ShouldSkipEmailLookup() {
        // Arrange
        when(firebaseToken.getUid()).thenReturn(testFirebaseUid);
        when(firebaseToken.getEmail()).thenReturn(null);
        when(firebaseToken.getClaims()).thenReturn(createClaimsWithPhone(testPhone));
        when(userRepository.findByFirebaseUid(testFirebaseUid)).thenReturn(null);
        when(userRepository.findByPhoneNumber(testPhone)).thenReturn(null);
        when(userRepository.save(any(User.class))).thenReturn(testUser);

        // Act
        User result = customUserDetailsService.createOrUpdateUserFromFirebaseToken(firebaseToken);

        // Assert
        assertNotNull(result);
        verify(userRepository).findByFirebaseUid(testFirebaseUid);
        verify(userRepository, never()).findByEmail(anyString());
        verify(userRepository).findByPhoneNumber(testPhone);
        verify(userRepository).save(any(User.class));
    }

    @Test
    void createOrUpdateUserFromFirebaseToken_WithNullPhone_ShouldSkipPhoneLookup() {
        // Arrange
        when(firebaseToken.getUid()).thenReturn(testFirebaseUid);
        when(firebaseToken.getEmail()).thenReturn(testEmail);
        when(firebaseToken.getName()).thenReturn(testName);
        when(firebaseToken.getPicture()).thenReturn(testPicture);
        when(firebaseToken.getClaims()).thenReturn(null);
        when(userRepository.findByFirebaseUid(testFirebaseUid)).thenReturn(null);
        when(userRepository.findByEmail(testEmail)).thenReturn(null);
        when(userRepository.save(any(User.class))).thenReturn(testUser);

        // Act
        User result = customUserDetailsService.createOrUpdateUserFromFirebaseToken(firebaseToken);

        // Assert
        assertNotNull(result);
        verify(userRepository).findByFirebaseUid(testFirebaseUid);
        verify(userRepository).findByEmail(testEmail);
        verify(userRepository, never()).findByPhoneNumber(anyString());
        verify(userRepository).save(any(User.class));
    }

    @Test
    void createOrUpdateUserFromFirebaseToken_WithEmptyClaims_ShouldSkipPhoneLookup() {
        // Arrange
        when(firebaseToken.getUid()).thenReturn(testFirebaseUid);
        when(firebaseToken.getEmail()).thenReturn(testEmail);
        when(firebaseToken.getName()).thenReturn(testName);
        when(firebaseToken.getPicture()).thenReturn(testPicture);
        when(firebaseToken.getClaims()).thenReturn(new HashMap<>());
        when(userRepository.findByFirebaseUid(testFirebaseUid)).thenReturn(null);
        when(userRepository.findByEmail(testEmail)).thenReturn(null);
        when(userRepository.save(any(User.class))).thenReturn(testUser);

        // Act
        User result = customUserDetailsService.createOrUpdateUserFromFirebaseToken(firebaseToken);

        // Assert
        assertNotNull(result);
        verify(userRepository).findByFirebaseUid(testFirebaseUid);
        verify(userRepository).findByEmail(testEmail);
        verify(userRepository, never()).findByPhoneNumber(anyString());
        verify(userRepository).save(any(User.class));
    }

    @Test
    void createOrUpdateUserFromFirebaseToken_WithNullName_ShouldCreateUserWithNullName() {
        // Arrange
        when(firebaseToken.getUid()).thenReturn(testFirebaseUid);
        when(firebaseToken.getEmail()).thenReturn(testEmail);
        when(firebaseToken.getName()).thenReturn(null);
        when(firebaseToken.getPicture()).thenReturn(testPicture);
        when(firebaseToken.getClaims()).thenReturn(null);
        when(userRepository.findByFirebaseUid(testFirebaseUid)).thenReturn(null);
        when(userRepository.findByEmail(testEmail)).thenReturn(null);
        when(userRepository.save(any(User.class))).thenReturn(testUser);

        // Act
        User result = customUserDetailsService.createOrUpdateUserFromFirebaseToken(firebaseToken);

        // Assert
        assertNotNull(result);
        verify(userRepository).save(any(User.class));
    }

    @Test
    void createOrUpdateUserFromFirebaseToken_WithNullPicture_ShouldCreateUserWithNullPicture() {
        // Arrange
        when(firebaseToken.getUid()).thenReturn(testFirebaseUid);
        when(firebaseToken.getEmail()).thenReturn(testEmail);
        when(firebaseToken.getName()).thenReturn(testName);
        when(firebaseToken.getPicture()).thenReturn(null);
        when(firebaseToken.getClaims()).thenReturn(null);
        when(userRepository.findByFirebaseUid(testFirebaseUid)).thenReturn(null);
        when(userRepository.findByEmail(testEmail)).thenReturn(null);
        when(userRepository.save(any(User.class))).thenReturn(testUser);

        // Act
        User result = customUserDetailsService.createOrUpdateUserFromFirebaseToken(firebaseToken);

        // Assert
        assertNotNull(result);
        verify(userRepository).save(any(User.class));
    }

    @Test
    void createOrUpdateUserFromFirebaseToken_WithEmptyEmail_ShouldStillCallEmailLookup() {
        // Arrange
        when(firebaseToken.getUid()).thenReturn(testFirebaseUid);
        when(firebaseToken.getEmail()).thenReturn("");
        when(firebaseToken.getClaims()).thenReturn(createClaimsWithPhone(testPhone));
        when(userRepository.findByFirebaseUid(testFirebaseUid)).thenReturn(null);
        when(userRepository.findByEmail("")).thenReturn(null);
        when(userRepository.findByPhoneNumber(testPhone)).thenReturn(null);
        when(userRepository.save(any(User.class))).thenReturn(testUser);

        // Act
        User result = customUserDetailsService.createOrUpdateUserFromFirebaseToken(firebaseToken);

        // Assert
        assertNotNull(result);
        verify(userRepository).findByFirebaseUid(testFirebaseUid);
        verify(userRepository).findByEmail("");
        verify(userRepository).findByPhoneNumber(testPhone);
        verify(userRepository).save(any(User.class));
    }

    @Test
    void createOrUpdateUserFromFirebaseToken_WithEmptyPhone_ShouldStillCallPhoneLookup() {
        // Arrange
        when(firebaseToken.getUid()).thenReturn(testFirebaseUid);
        when(firebaseToken.getEmail()).thenReturn(testEmail);
        when(firebaseToken.getName()).thenReturn(testName);
        when(firebaseToken.getPicture()).thenReturn(testPicture);
        when(firebaseToken.getClaims()).thenReturn(createClaimsWithPhone(""));
        when(userRepository.findByFirebaseUid(testFirebaseUid)).thenReturn(null);
        when(userRepository.findByEmail(testEmail)).thenReturn(null);
        when(userRepository.findByPhoneNumber("")).thenReturn(null);
        when(userRepository.save(any(User.class))).thenReturn(testUser);

        // Act
        User result = customUserDetailsService.createOrUpdateUserFromFirebaseToken(firebaseToken);

        // Assert
        assertNotNull(result);
        verify(userRepository).findByFirebaseUid(testFirebaseUid);
        verify(userRepository).findByEmail(testEmail);
        verify(userRepository).findByPhoneNumber("");
        verify(userRepository).save(any(User.class));
    }

    @Test
    void createOrUpdateUserFromFirebaseToken_WithNullPhoneInClaims_ShouldSkipPhoneLookup() {
        // Arrange
        Map<String, Object> claims = new HashMap<>();
        claims.put("phone_number", null);
        when(firebaseToken.getUid()).thenReturn(testFirebaseUid);
        when(firebaseToken.getEmail()).thenReturn(testEmail);
        when(firebaseToken.getName()).thenReturn(testName);
        when(firebaseToken.getPicture()).thenReturn(testPicture);
        when(firebaseToken.getClaims()).thenReturn(claims);
        when(userRepository.findByFirebaseUid(testFirebaseUid)).thenReturn(null);
        when(userRepository.findByEmail(testEmail)).thenReturn(null);
        when(userRepository.save(any(User.class))).thenReturn(testUser);

        // Act
        User result = customUserDetailsService.createOrUpdateUserFromFirebaseToken(firebaseToken);

        // Assert
        assertNotNull(result);
        verify(userRepository).findByFirebaseUid(testFirebaseUid);
        verify(userRepository).findByEmail(testEmail);
        verify(userRepository, never()).findByPhoneNumber(anyString());
        verify(userRepository).save(any(User.class));
    }

    private Map<String, Object> createClaimsWithPhone(String phone) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("phone_number", phone);
        return claims;
    }
}
