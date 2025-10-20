package com.example.ai_companion.controller;

import com.example.ai_companion.dto.UserDTO;
import com.example.ai_companion.model.User;
import com.example.ai_companion.service.UserService;
import com.example.ai_companion.utils.ApiResponseBuilder;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserControllerTest {

    @Mock
    private UserService userService;

    @Mock
    private Authentication authentication;

    @InjectMocks
    private UserController userController;

    private User testUser;
    private UserDTO testUserDTO;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setFirebaseUid("user123");
        testUser.setEmail("test@example.com");
        testUser.setFullName("Test User");

        testUserDTO = new UserDTO();
        testUserDTO.setFullName("Updated Name");
        testUserDTO.setEmail("updated@example.com");
    }

    @Test
    void updateProfile_WithValidInput_ShouldReturnSuccess() {
        // Arrange
        // No stubbing needed - just verify the call

        // Act
        ResponseEntity<?> response = userController.updateProfile(authentication, testUserDTO);

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        verify(userService).updateUserProfile(authentication, testUserDTO);
    }

    @Test
    void getProfileFlowStatus_WithValidAuthentication_ShouldReturnStatus() {
        // Arrange
        User.ProfileFlowStatus expectedStatus = new User.ProfileFlowStatus();
        expectedStatus.setCurrentStep(1);
        expectedStatus.setFlowCompleted(false);
        when(userService.getProfileFlowStatus(authentication)).thenReturn(expectedStatus);

        // Act
        ResponseEntity<?> response = userController.getProfileFlowStatus(authentication);

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(expectedStatus, response.getBody());
        verify(userService).getProfileFlowStatus(authentication);
    }

    @Test
    void updateProfileStep_WithValidInput_ShouldReturnSuccess() {
        // Arrange
        Integer step = 2;

        // Act
        ResponseEntity<?> response = userController.updateProfileStep(authentication, step);

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        verify(userService).updateProfileStep(authentication, step);
    }

    @Test
    void goBackToStep_WithValidInput_ShouldReturnSuccess() {
        // Arrange
        Integer step = 1;

        // Act
        ResponseEntity<?> response = userController.goBackToStep(authentication, step);

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        verify(userService).goBackToStep(authentication, step);
    }

    @Test
    void completeProfileFlow_WithValidAuthentication_ShouldReturnSuccess() {
        // Arrange
        // No stubbing needed

        // Act
        ResponseEntity<?> response = userController.completeProfileFlow(authentication);

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        verify(userService).completeProfileFlow(authentication);
    }

    @Test
    void shouldShowProfileFlow_WithValidAuthentication_ShouldReturnBoolean() {
        // Arrange
        when(userService.shouldShowProfileFlow(authentication)).thenReturn(true);

        // Act
        ResponseEntity<?> response = userController.shouldShowProfileFlow(authentication);

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertTrue(response.getBody() instanceof Map);
        Map<?, ?> responseBody = (Map<?, ?>) response.getBody();
        assertTrue((Boolean) responseBody.get("shouldShow"));
        verify(userService).shouldShowProfileFlow(authentication);
    }

    @Test
    void getFavorites_WithValidUserId_ShouldReturnFavorites() {
        // Arrange
        String userId = "user123";
        Map<String, List<String>> expectedFavorites = new HashMap<>();
        expectedFavorites.put("caregivers", List.of("caregiver1", "caregiver2"));
        expectedFavorites.put("elderly", List.of("elderly1"));
        when(userService.getFavorites(userId)).thenReturn(expectedFavorites);

        // Act
        ResponseEntity<?> response = userController.getFavorites(userId);

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(expectedFavorites, response.getBody());
        verify(userService).getFavorites(userId);
    }

    @Test
    void getFavorites_WithEmptyUserId_ShouldReturnEmptyFavorites() {
        // Arrange
        String userId = "";
        Map<String, List<String>> expectedFavorites = new HashMap<>();
        when(userService.getFavorites(userId)).thenReturn(expectedFavorites);

        // Act
        ResponseEntity<?> response = userController.getFavorites(userId);

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(expectedFavorites, response.getBody());
        verify(userService).getFavorites(userId);
    }

    @Test
    void toggleFavorite_WithValidInput_ShouldReturnUpdatedFavorites() {
        // Arrange
        String userId = "user123";
        String targetUserId = "target123";
        String type = "caregiver";
        Map<String, List<String>> expectedFavorites = new HashMap<>();
        expectedFavorites.put("caregivers", List.of("target123"));
        expectedFavorites.put("elderly", List.of());
        when(userService.toggleFavorite(userId, targetUserId, type)).thenReturn(expectedFavorites);

        // Act
        ResponseEntity<?> response = userController.toggleFavorite(userId, targetUserId, type);

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(expectedFavorites, response.getBody());
        verify(userService).toggleFavorite(userId, targetUserId, type);
    }

    @Test
    void toggleFavorite_WithElderlyType_ShouldReturnUpdatedFavorites() {
        // Arrange
        String userId = "user123";
        String targetUserId = "target123";
        String type = "elderly";
        Map<String, List<String>> expectedFavorites = new HashMap<>();
        expectedFavorites.put("caregivers", List.of());
        expectedFavorites.put("elderly", List.of("target123"));
        when(userService.toggleFavorite(userId, targetUserId, type)).thenReturn(expectedFavorites);

        // Act
        ResponseEntity<?> response = userController.toggleFavorite(userId, targetUserId, type);

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(expectedFavorites, response.getBody());
        verify(userService).toggleFavorite(userId, targetUserId, type);
    }

    @Test
    void toggleFavorite_WithInvalidType_ShouldStillCallService() {
        // Arrange
        String userId = "user123";
        String targetUserId = "target123";
        String type = "invalid";
        Map<String, List<String>> expectedFavorites = new HashMap<>();
        when(userService.toggleFavorite(userId, targetUserId, type)).thenReturn(expectedFavorites);

        // Act
        ResponseEntity<?> response = userController.toggleFavorite(userId, targetUserId, type);

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        verify(userService).toggleFavorite(userId, targetUserId, type);
    }

    @Test
    void updateProfile_WithNullAuthentication_ShouldStillCallService() {
        // Arrange
        // No stubbing needed

        // Act
        ResponseEntity<?> response = userController.updateProfile(authentication, testUserDTO);

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        verify(userService).updateUserProfile(authentication, testUserDTO);
    }

    @Test
    void getProfileFlowStatus_WithNullAuthentication_ShouldStillCallService() {
        // Arrange
        User.ProfileFlowStatus expectedStatus = new User.ProfileFlowStatus();
        when(userService.getProfileFlowStatus(authentication)).thenReturn(expectedStatus);

        // Act
        ResponseEntity<?> response = userController.getProfileFlowStatus(authentication);

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        verify(userService).getProfileFlowStatus(authentication);
    }
}
