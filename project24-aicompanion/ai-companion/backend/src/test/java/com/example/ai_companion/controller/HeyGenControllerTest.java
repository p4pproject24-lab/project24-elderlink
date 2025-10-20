package com.example.ai_companion.controller;

import com.example.ai_companion.dto.HeyGenSessionRequest;
import com.example.ai_companion.dto.HeyGenStartSessionRequest;
import com.example.ai_companion.model.User;
import com.example.ai_companion.response.HeyGenSessionResponse;
import com.example.ai_companion.service.HeyGenService;
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
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class HeyGenControllerTest {

    @Mock
    private HeyGenService heyGenService;

    @Mock
    private Authentication authentication;

    @InjectMocks
    private HeyGenController heyGenController;

    private User testUser;
    private String testUserId;
    private HeyGenSessionRequest testSessionRequest;
    private HeyGenStartSessionRequest testStartSessionRequest;
    private HeyGenSessionResponse testSessionResponse;

    @BeforeEach
    void setUp() {
        testUserId = "user123";
        testUser = new User();
        testUser.setFirebaseUid(testUserId);
        testUser.setEmail("test@example.com");
        testUser.setFullName("Test User");

        testSessionRequest = new HeyGenSessionRequest();
        testSessionRequest.setAvatarId("avatar123");
        HeyGenSessionRequest.VoiceSettings voiceSettings = new HeyGenSessionRequest.VoiceSettings();
        voiceSettings.setVoiceId("voice123");
        testSessionRequest.setVoice(voiceSettings);

        testStartSessionRequest = new HeyGenStartSessionRequest();
        testStartSessionRequest.setSessionId("session123");

        testSessionResponse = new HeyGenSessionResponse();
        testSessionResponse.setSessionId("session123");
    }

    @Test
    void getSessionToken_ShouldReturnToken() {
        // Arrange
        String expectedToken = "token123";
        when(heyGenService.createSessionToken()).thenReturn(expectedToken);

        // Act
        ResponseEntity<?> response = heyGenController.getSessionToken();

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        verify(heyGenService).createSessionToken();
    }

    @Test
    void createSession_WithValidRequest_ShouldReturnSessionInfo() {
        // Arrange
        when(heyGenService.createSession(testSessionRequest)).thenReturn(testSessionResponse);

        // Act
        ResponseEntity<?> response = heyGenController.createSession(testSessionRequest);

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        verify(heyGenService).createSession(testSessionRequest);
    }

    @Test
    void createSession_WithNullRequest_ShouldThrowException() {
        // Arrange
        // No stubbing needed

        // Act & Assert
        assertThrows(NullPointerException.class, () -> {
            heyGenController.createSession(null);
        });
    }

    @Test
    void startSession_WithValidAuthentication_ShouldReturnStartInfo() {
        // Arrange
        when(authentication.getPrincipal()).thenReturn(testUser);
        when(heyGenService.startSession(testUserId, testStartSessionRequest)).thenReturn(testSessionResponse);

        // Act
        ResponseEntity<?> response = heyGenController.startSession(authentication, testStartSessionRequest);

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        verify(heyGenService).startSession(testUserId, testStartSessionRequest);
    }

    @Test
    void startSession_WithNullAuthentication_ShouldThrowException() {
        // Arrange
        when(authentication.getPrincipal()).thenReturn(null);

        // Act & Assert
        assertThrows(NullPointerException.class, () -> {
            heyGenController.startSession(authentication, testStartSessionRequest);
        });
    }

    @Test
    void startSession_WithNullRequest_ShouldThrowException() {
        // Arrange
        when(authentication.getPrincipal()).thenReturn(testUser);

        // Act & Assert
        assertThrows(NullPointerException.class, () -> {
            heyGenController.startSession(authentication, null);
        });
    }

    @Test
    void sendTask_WithValidPayload_ShouldReturnTaskResult() {
        // Arrange
        Map<String, String> payload = new HashMap<>();
        payload.put("sessionId", "session123");
        payload.put("text", "Hello avatar");
        payload.put("taskType", "talk");

        Map<String, Object> expectedResult = new HashMap<>();
        expectedResult.put("status", "success");
        when(heyGenService.sendTaskToHeyGen("session123", "Hello avatar", "talk", null)).thenReturn(expectedResult);

        // Act
        ResponseEntity<?> response = heyGenController.sendTask(payload);

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        verify(heyGenService).sendTaskToHeyGen("session123", "Hello avatar", "talk", null);
    }

    @Test
    void sendTask_WithDefaultTaskType_ShouldUseDefault() {
        // Arrange
        Map<String, String> payload = new HashMap<>();
        payload.put("sessionId", "session123");
        payload.put("text", "Hello avatar");

        Map<String, Object> expectedResult = new HashMap<>();
        expectedResult.put("status", "success");
        when(heyGenService.sendTaskToHeyGen("session123", "Hello avatar", "talk", null)).thenReturn(expectedResult);

        // Act
        ResponseEntity<?> response = heyGenController.sendTask(payload);

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        verify(heyGenService).sendTaskToHeyGen("session123", "Hello avatar", "talk", null);
    }

    @Test
    void sendTask_WithNullPayload_ShouldThrowException() {
        // Act & Assert
        assertThrows(NullPointerException.class, () -> {
            heyGenController.sendTask(null);
        });
    }

    @Test
    void sendTask_WithMissingSessionId_ShouldCallServiceWithNull() {
        // Arrange
        Map<String, String> payload = new HashMap<>();
        payload.put("text", "Hello avatar");

        Map<String, Object> expectedResult = new HashMap<>();
        expectedResult.put("status", "success");
        when(heyGenService.sendTaskToHeyGen(null, "Hello avatar", "talk", null)).thenReturn(expectedResult);

        // Act
        ResponseEntity<?> response = heyGenController.sendTask(payload);

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        verify(heyGenService).sendTaskToHeyGen(null, "Hello avatar", "talk", null);
    }

    @Test
    void sendTask_WithMissingText_ShouldCallServiceWithNull() {
        // Arrange
        Map<String, String> payload = new HashMap<>();
        payload.put("sessionId", "session123");

        Map<String, Object> expectedResult = new HashMap<>();
        expectedResult.put("status", "success");
        when(heyGenService.sendTaskToHeyGen("session123", null, "talk", null)).thenReturn(expectedResult);

        // Act
        ResponseEntity<?> response = heyGenController.sendTask(payload);

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        verify(heyGenService).sendTaskToHeyGen("session123", null, "talk", null);
    }

    @Test
    void stopSession_WithValidPayload_ShouldReturnSuccess() {
        // Arrange
        Map<String, String> payload = new HashMap<>();
        payload.put("sessionId", "session123");

        // Act
        ResponseEntity<?> response = heyGenController.stopSession(payload);

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        verify(heyGenService).stopSession("session123");
    }

    @Test
    void stopSession_WithNullPayload_ShouldThrowException() {
        // Act & Assert
        assertThrows(NullPointerException.class, () -> {
            heyGenController.stopSession(null);
        });
    }

    @Test
    void stopSession_WithMissingSessionId_ShouldCallServiceWithNull() {
        // Arrange
        Map<String, String> payload = new HashMap<>();

        // Act
        ResponseEntity<?> response = heyGenController.stopSession(payload);

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        verify(heyGenService).stopSession(null);
    }

    @Test
    void getAvatarDetails_WithValidAvatarId_ShouldReturnDetails() {
        // Arrange
        String avatarId = "avatar123";
        when(heyGenService.getApiKey()).thenReturn("api-key-123");

        // Act
        ResponseEntity<?> response = heyGenController.getAvatarDetails(avatarId);

        // Assert
        // Note: This test is limited because it makes actual HTTP calls
        // In a real test, you'd mock the RestTemplate
        assertNotNull(response);
    }

    @Test
    void getAvatarDetails_WithNullAvatarId_ShouldStillMakeRequest() {
        // Arrange
        when(heyGenService.getApiKey()).thenReturn("api-key-123");

        // Act
        ResponseEntity<?> response = heyGenController.getAvatarDetails(null);

        // Assert
        assertNotNull(response);
    }

    @Test
    void getAvatarList_ShouldReturnAvatarList() {
        // Arrange
        Map<String, Object> expectedAvatars = new HashMap<>();
        expectedAvatars.put("avatars", "list");
        when(heyGenService.getPublicInteractiveAvatars()).thenReturn(expectedAvatars);

        // Act
        ResponseEntity<?> response = heyGenController.getAvatarList();

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(expectedAvatars, response.getBody());
        verify(heyGenService).getPublicInteractiveAvatars();
    }

    @Test
    void getSessionToken_WithServiceException_ShouldPropagateException() {
        // Arrange
        when(heyGenService.createSessionToken()).thenThrow(new RuntimeException("Service error"));

        // Act & Assert
        assertThrows(RuntimeException.class, () -> {
            heyGenController.getSessionToken();
        });
    }

    @Test
    void createSession_WithServiceException_ShouldPropagateException() {
        // Arrange
        when(heyGenService.createSession(any())).thenThrow(new RuntimeException("Service error"));

        // Act & Assert
        assertThrows(RuntimeException.class, () -> {
            heyGenController.createSession(testSessionRequest);
        });
    }

    @Test
    void startSession_WithServiceException_ShouldPropagateException() {
        // Arrange
        when(authentication.getPrincipal()).thenReturn(testUser);
        when(heyGenService.startSession(anyString(), any())).thenThrow(new RuntimeException("Service error"));

        // Act & Assert
        assertThrows(RuntimeException.class, () -> {
            heyGenController.startSession(authentication, testStartSessionRequest);
        });
    }
}
