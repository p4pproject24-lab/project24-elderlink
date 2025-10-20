package com.example.ai_companion.controller;

import com.example.ai_companion.model.User;
import com.example.ai_companion.repository.UserRepository;
import com.example.ai_companion.response.ApiResponse;
import com.example.ai_companion.response.UserResponse;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseAuthException;
import com.google.firebase.auth.FirebaseToken;
import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;

import java.util.HashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthControllerTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private Authentication authentication;

    @Mock
    private HttpServletRequest request;

    @Mock
    private FirebaseAuth firebaseAuth;

    @Mock
    private FirebaseToken firebaseToken;

    @InjectMocks
    private AuthController authController;

    private User testUser;
    private UserResponse expectedUserResponse;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId("user123");
        testUser.setFirebaseUid("firebase123");
        testUser.setEmail("test@example.com");
        testUser.setFullName("John Doe");
        testUser.setPhoneNumber("1234567890");
        testUser.setDateOfBirth("1990-01-01");
        testUser.setRole(User.Role.ELDERLY);
        testUser.setProfileImageUrl("http://example.com/image.jpg");
        testUser.setAddress("123 Main St");
        testUser.setBloodType("O+");
        testUser.setGender("Male");
        testUser.setCoreInformation("Test core info");
        testUser.setDailyLife("Test daily life");
        testUser.setRelationships("Test relationships");
        testUser.setMedicalNeeds("Test medical needs");
        testUser.setHobbies("Test hobbies");
        testUser.setAnythingElse("Test anything else");

        expectedUserResponse = new UserResponse();
        expectedUserResponse.setId("user123");
        expectedUserResponse.setFirebaseUid("firebase123");
        expectedUserResponse.setEmail("test@example.com");
        expectedUserResponse.setFullName("John Doe");
        expectedUserResponse.setPhoneNumber("1234567890");
        expectedUserResponse.setDateOfBirth("1990-01-01");
        expectedUserResponse.setRole("ELDERLY");
        expectedUserResponse.setProfileImageUrl("http://example.com/image.jpg");
        expectedUserResponse.setAddress("123 Main St");
        expectedUserResponse.setBloodType("O+");
        expectedUserResponse.setGender("Male");
        expectedUserResponse.setCoreInformation("Test core info");
        expectedUserResponse.setDailyLife("Test daily life");
        expectedUserResponse.setRelationships("Test relationships");
        expectedUserResponse.setMedicalNeeds("Test medical needs");
        expectedUserResponse.setHobbies("Test hobbies");
        expectedUserResponse.setAnythingElse("Test anything else");
    }

    @Test
    void getCurrentUser_WithValidAuthentication_ShouldReturnUserResponse() {
        // Arrange
        when(authentication.getPrincipal()).thenReturn(testUser);

        // Act
        ResponseEntity<?> response = authController.getCurrentUser(authentication, request);

        // Assert
        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertTrue(response.getBody() instanceof ApiResponse);
        
        ApiResponse apiResponse = (ApiResponse) response.getBody();
        assertEquals(HttpStatus.OK.value(), apiResponse.getStatus());
        assertEquals("User fetched successfully", apiResponse.getMessage());
        assertNotNull(apiResponse.getData());
        
        @SuppressWarnings("unchecked")
        Map<String, Object> data = (Map<String, Object>) apiResponse.getData();
        assertTrue(data.containsKey("user"));
        UserResponse userResponse = (UserResponse) data.get("user");
        assertEquals(expectedUserResponse.getFullName(), userResponse.getFullName());
        assertEquals(expectedUserResponse.getEmail(), userResponse.getEmail());
        assertEquals(expectedUserResponse.getRole(), userResponse.getRole());
    }

    @Test
    void getCurrentUser_WithNullAuthentication_ShouldUseFirebaseToken() {
        // Arrange
        when(authentication.getPrincipal()).thenReturn(null);
        when(request.getHeader("Authorization")).thenReturn("Bearer valid-token");
        when(userRepository.findByFirebaseUid("firebase123")).thenReturn(testUser);

        try (MockedStatic<FirebaseAuth> mockedFirebaseAuth = mockStatic(FirebaseAuth.class)) {
            mockedFirebaseAuth.when(FirebaseAuth::getInstance).thenReturn(firebaseAuth);
            when(firebaseAuth.verifyIdToken("valid-token")).thenReturn(firebaseToken);
            when(firebaseToken.getUid()).thenReturn("firebase123");

            // Act
            ResponseEntity<?> response = authController.getCurrentUser(authentication, request);

            // Assert
            assertNotNull(response);
            assertEquals(HttpStatus.OK, response.getStatusCode());
        } catch (FirebaseAuthException e) {
            fail("FirebaseAuthException should not be thrown in this test");
        }
    }

    @Test
    void getCurrentUser_WithInvalidAuthHeader_ShouldReturnBadRequest() {
        // Arrange
        when(authentication.getPrincipal()).thenReturn(null);
        when(request.getHeader("Authorization")).thenReturn("Invalid header");

        // Act
        ResponseEntity<?> response = authController.getCurrentUser(authentication, request);

        // Assert
        assertNotNull(response);
        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertTrue(response.getBody() instanceof ApiResponse);
        
        ApiResponse apiResponse = (ApiResponse) response.getBody();
        assertEquals("Missing or invalid Authorization header", apiResponse.getMessage());
    }

    @Test
    void getCurrentUser_WithNullAuthHeader_ShouldReturnBadRequest() {
        // Arrange
        when(authentication.getPrincipal()).thenReturn(null);
        when(request.getHeader("Authorization")).thenReturn(null);

        // Act
        ResponseEntity<?> response = authController.getCurrentUser(authentication, request);

        // Assert
        assertNotNull(response);
        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
    }

    @Test
    void getCurrentUser_WithNewFirebaseUser_ShouldCreateNewUser() {
        // Arrange
        when(authentication.getPrincipal()).thenReturn(null);
        when(request.getHeader("Authorization")).thenReturn("Bearer valid-token");
        when(userRepository.findByFirebaseUid("firebase123")).thenReturn(null);
        when(userRepository.save(any(User.class))).thenReturn(testUser);

        try (MockedStatic<FirebaseAuth> mockedFirebaseAuth = mockStatic(FirebaseAuth.class)) {
            mockedFirebaseAuth.when(FirebaseAuth::getInstance).thenReturn(firebaseAuth);
            when(firebaseAuth.verifyIdToken("valid-token")).thenReturn(firebaseToken);
            when(firebaseToken.getUid()).thenReturn("firebase123");
            when(firebaseToken.getEmail()).thenReturn("test@example.com");
            when(firebaseToken.getName()).thenReturn("John Doe");
            when(firebaseToken.getPicture()).thenReturn("http://example.com/image.jpg");

            // Act
            ResponseEntity<?> response = authController.getCurrentUser(authentication, request);

            // Assert
            assertNotNull(response);
            assertEquals(HttpStatus.OK, response.getStatusCode());
            verify(userRepository).save(any(User.class));
        } catch (FirebaseAuthException e) {
            fail("FirebaseAuthException should not be thrown in this test");
        }
    }

    @Test
    void getCurrentUser_WithFirebaseException_ShouldReturnUnauthorized() {
        // Arrange
        when(authentication.getPrincipal()).thenReturn(null);
        when(request.getHeader("Authorization")).thenReturn("Bearer invalid-token");

        try (MockedStatic<FirebaseAuth> mockedFirebaseAuth = mockStatic(FirebaseAuth.class)) {
            mockedFirebaseAuth.when(FirebaseAuth::getInstance).thenReturn(firebaseAuth);
            when(firebaseAuth.verifyIdToken("invalid-token")).thenThrow(new RuntimeException("Invalid token"));

            // Act
            ResponseEntity<?> response = authController.getCurrentUser(authentication, request);

            // Assert
            assertNotNull(response);
            assertEquals(HttpStatus.UNAUTHORIZED, response.getStatusCode());
            assertTrue(response.getBody() instanceof ApiResponse);
            
            ApiResponse apiResponse = (ApiResponse) response.getBody();
            assertTrue(apiResponse.getMessage().toString().contains("Invalid token"));
        } catch (FirebaseAuthException e) {
            fail("FirebaseAuthException should not be thrown in this test");
        }
    }

    @Test
    void updateRole_WithValidAuthentication_ShouldUpdateRole() {
        // Arrange
        Map<String, String> payload = new HashMap<>();
        payload.put("role", "CAREGIVER");
        when(authentication.getPrincipal()).thenReturn(testUser);
        when(userRepository.save(any(User.class))).thenReturn(testUser);

        // Act
        ResponseEntity<?> response = authController.updateRole(authentication, request, payload);

        // Assert
        assertNotNull(response);
        assertEquals(HttpStatus.NO_CONTENT, response.getStatusCode());
        verify(userRepository).save(any(User.class));
    }

    @Test
    void updateRole_WithNullAuthentication_ShouldUseFirebaseToken() {
        // Arrange
        Map<String, String> payload = new HashMap<>();
        payload.put("role", "ELDERLY");
        when(authentication.getPrincipal()).thenReturn(null);
        when(request.getHeader("Authorization")).thenReturn("Bearer valid-token");
        when(userRepository.findByFirebaseUid("firebase123")).thenReturn(testUser);
        when(userRepository.save(any(User.class))).thenReturn(testUser);

        try (MockedStatic<FirebaseAuth> mockedFirebaseAuth = mockStatic(FirebaseAuth.class)) {
            mockedFirebaseAuth.when(FirebaseAuth::getInstance).thenReturn(firebaseAuth);
            when(firebaseAuth.verifyIdToken("valid-token")).thenReturn(firebaseToken);
            when(firebaseToken.getUid()).thenReturn("firebase123");

            // Act
            ResponseEntity<?> response = authController.updateRole(authentication, request, payload);

            // Assert
            assertNotNull(response);
            assertEquals(HttpStatus.NO_CONTENT, response.getStatusCode());
        } catch (FirebaseAuthException e) {
            fail("FirebaseAuthException should not be thrown in this test");
        }
    }

    @Test
    void updateRole_WithInvalidRole_ShouldReturnBadRequest() {
        // Arrange
        Map<String, String> payload = new HashMap<>();
        payload.put("role", "INVALID_ROLE");
        when(authentication.getPrincipal()).thenReturn(testUser);

        // Act
        ResponseEntity<?> response = authController.updateRole(authentication, request, payload);

        // Assert
        assertNotNull(response);
        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertTrue(response.getBody() instanceof ApiResponse);
        
        ApiResponse apiResponse = (ApiResponse) response.getBody();
        assertEquals("Invalid role. Must be 'ELDERLY' or 'CAREGIVER'.", apiResponse.getMessage());
    }

    @Test
    void updateRole_WithNullRole_ShouldReturnBadRequest() {
        // Arrange
        Map<String, String> payload = new HashMap<>();
        payload.put("role", null);
        when(authentication.getPrincipal()).thenReturn(testUser);

        // Act
        ResponseEntity<?> response = authController.updateRole(authentication, request, payload);

        // Assert
        assertNotNull(response);
        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
    }

    @Test
    void updateRole_WithUserNotFound_ShouldReturnNotFound() {
        // Arrange
        Map<String, String> payload = new HashMap<>();
        payload.put("role", "ELDERLY");
        when(authentication.getPrincipal()).thenReturn(null);
        when(request.getHeader("Authorization")).thenReturn("Bearer valid-token");
        when(userRepository.findByFirebaseUid("firebase123")).thenReturn(null);

        try (MockedStatic<FirebaseAuth> mockedFirebaseAuth = mockStatic(FirebaseAuth.class)) {
            mockedFirebaseAuth.when(FirebaseAuth::getInstance).thenReturn(firebaseAuth);
            when(firebaseAuth.verifyIdToken("valid-token")).thenReturn(firebaseToken);
            when(firebaseToken.getUid()).thenReturn("firebase123");

            // Act
            ResponseEntity<?> response = authController.updateRole(authentication, request, payload);

            // Assert
            assertNotNull(response);
            assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
        } catch (FirebaseAuthException e) {
            fail("FirebaseAuthException should not be thrown in this test");
        }
    }

    @Test
    void updateRole_WithFirebaseException_ShouldReturnUnauthorized() {
        // Arrange
        Map<String, String> payload = new HashMap<>();
        payload.put("role", "ELDERLY");
        when(authentication.getPrincipal()).thenReturn(null);
        when(request.getHeader("Authorization")).thenReturn("Bearer invalid-token");

        try (MockedStatic<FirebaseAuth> mockedFirebaseAuth = mockStatic(FirebaseAuth.class)) {
            mockedFirebaseAuth.when(FirebaseAuth::getInstance).thenReturn(firebaseAuth);
            when(firebaseAuth.verifyIdToken("invalid-token")).thenThrow(new RuntimeException("Invalid token"));

            // Act
            ResponseEntity<?> response = authController.updateRole(authentication, request, payload);

            // Assert
            assertNotNull(response);
            assertEquals(HttpStatus.UNAUTHORIZED, response.getStatusCode());
        } catch (FirebaseAuthException e) {
            fail("FirebaseAuthException should not be thrown in this test");
        }
    }

    @Test
    void updateRole_WithValidElderlyRole_ShouldUpdateToElderly() {
        // Arrange
        Map<String, String> payload = new HashMap<>();
        payload.put("role", "ELDERLY");
        when(authentication.getPrincipal()).thenReturn(testUser);
        when(userRepository.save(any(User.class))).thenReturn(testUser);

        // Act
        ResponseEntity<?> response = authController.updateRole(authentication, request, payload);

        // Assert
        assertNotNull(response);
        assertEquals(HttpStatus.NO_CONTENT, response.getStatusCode());
        verify(userRepository).save(any(User.class));
    }

    @Test
    void updateRole_WithValidCaregiverRole_ShouldUpdateToCaregiver() {
        // Arrange
        Map<String, String> payload = new HashMap<>();
        payload.put("role", "CAREGIVER");
        when(authentication.getPrincipal()).thenReturn(testUser);
        when(userRepository.save(any(User.class))).thenReturn(testUser);

        // Act
        ResponseEntity<?> response = authController.updateRole(authentication, request, payload);

        // Assert
        assertNotNull(response);
        assertEquals(HttpStatus.NO_CONTENT, response.getStatusCode());
        verify(userRepository).save(any(User.class));
    }

    @Test
    void getCurrentUser_WithUserHavingNullRole_ShouldHandleGracefully() {
        // Arrange
        testUser.setRole(null);
        when(authentication.getPrincipal()).thenReturn(testUser);

        // Act
        ResponseEntity<?> response = authController.getCurrentUser(authentication, request);

        // Assert
        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertTrue(response.getBody() instanceof ApiResponse);
        
        ApiResponse apiResponse = (ApiResponse) response.getBody();
        @SuppressWarnings("unchecked")
        Map<String, Object> data = (Map<String, Object>) apiResponse.getData();
        UserResponse userResponse = (UserResponse) data.get("user");
        assertNull(userResponse.getRole());
    }

    @Test
    void getCurrentUser_WithUserHavingNullFields_ShouldHandleGracefully() {
        // Arrange
        testUser.setFullName(null);
        testUser.setEmail(null);
        testUser.setPhoneNumber(null);
        testUser.setDateOfBirth(null);
        testUser.setProfileImageUrl(null);
        testUser.setAddress(null);
        testUser.setBloodType(null);
        testUser.setGender(null);
        testUser.setCoreInformation(null);
        testUser.setDailyLife(null);
        testUser.setRelationships(null);
        testUser.setMedicalNeeds(null);
        testUser.setHobbies(null);
        testUser.setAnythingElse(null);
        
        when(authentication.getPrincipal()).thenReturn(testUser);

        // Act
        ResponseEntity<?> response = authController.getCurrentUser(authentication, request);

        // Assert
        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertTrue(response.getBody() instanceof ApiResponse);
        
        ApiResponse apiResponse = (ApiResponse) response.getBody();
        @SuppressWarnings("unchecked")
        Map<String, Object> data = (Map<String, Object>) apiResponse.getData();
        UserResponse userResponse = (UserResponse) data.get("user");
        assertNull(userResponse.getFullName());
        assertNull(userResponse.getEmail());
        assertNull(userResponse.getPhoneNumber());
        assertNull(userResponse.getDateOfBirth());
        assertNull(userResponse.getProfileImageUrl());
        assertNull(userResponse.getAddress());
        assertNull(userResponse.getBloodType());
        assertNull(userResponse.getGender());
        assertNull(userResponse.getCoreInformation());
        assertNull(userResponse.getDailyLife());
        assertNull(userResponse.getRelationships());
        assertNull(userResponse.getMedicalNeeds());
        assertNull(userResponse.getHobbies());
        assertNull(userResponse.getAnythingElse());
    }
}
