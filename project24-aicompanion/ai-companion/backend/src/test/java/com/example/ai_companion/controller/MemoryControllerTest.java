package com.example.ai_companion.controller;

import com.example.ai_companion.model.User;
import com.example.ai_companion.service.MemoryService;
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
class MemoryControllerTest {

    @Mock
    private MemoryService memoryService;

    @Mock
    private Authentication authentication;

    @InjectMocks
    private MemoryController memoryController;

    private User testUser;
    private String testUserId;

    @BeforeEach
    void setUp() {
        testUserId = "user123";
        testUser = new User();
        testUser.setFirebaseUid(testUserId);
        testUser.setEmail("test@example.com");
        testUser.setFullName("Test User");
    }

    @Test
    void addCoreInformation_WithValidInput_ShouldReturnSuccess() {
        // Arrange
        Map<String, String> payload = new HashMap<>();
        payload.put("coreInformation", "I am a 65-year-old retired teacher");
        
        when(authentication.getPrincipal()).thenReturn(testUser);

        // Act
        ResponseEntity<?> response = memoryController.addCoreInformation(authentication, payload);

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        verify(memoryService).addManualCoreInformation(testUserId, "I am a 65-year-old retired teacher");
    }

    @Test
    void addCoreInformation_WithEmptyCoreInformation_ShouldReturnBadRequest() {
        // Arrange
        Map<String, String> payload = new HashMap<>();
        payload.put("coreInformation", "");
        
        when(authentication.getPrincipal()).thenReturn(testUser);

        // Act
        ResponseEntity<?> response = memoryController.addCoreInformation(authentication, payload);

        // Assert
        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        verify(memoryService, never()).addManualCoreInformation(anyString(), anyString());
    }

    @Test
    void addCoreInformation_WithNullCoreInformation_ShouldReturnBadRequest() {
        // Arrange
        Map<String, String> payload = new HashMap<>();
        payload.put("coreInformation", null);
        
        when(authentication.getPrincipal()).thenReturn(testUser);

        // Act
        ResponseEntity<?> response = memoryController.addCoreInformation(authentication, payload);

        // Assert
        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        verify(memoryService, never()).addManualCoreInformation(anyString(), anyString());
    }

    @Test
    void addCoreInformation_WithWhitespaceOnlyCoreInformation_ShouldReturnBadRequest() {
        // Arrange
        Map<String, String> payload = new HashMap<>();
        payload.put("coreInformation", "   ");
        
        when(authentication.getPrincipal()).thenReturn(testUser);

        // Act
        ResponseEntity<?> response = memoryController.addCoreInformation(authentication, payload);

        // Assert
        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        verify(memoryService, never()).addManualCoreInformation(anyString(), anyString());
    }

    @Test
    void addCoreInformation_WithServiceException_ShouldReturnInternalServerError() {
        // Arrange
        Map<String, String> payload = new HashMap<>();
        payload.put("coreInformation", "Valid core information");
        
        when(authentication.getPrincipal()).thenReturn(testUser);
        doThrow(new RuntimeException("Service error")).when(memoryService).addManualCoreInformation(anyString(), anyString());

        // Act
        ResponseEntity<?> response = memoryController.addCoreInformation(authentication, payload);

        // Assert
        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, response.getStatusCode());
        verify(memoryService).addManualCoreInformation(testUserId, "Valid core information");
    }

    @Test
    void addContextualMemory_WithValidInput_ShouldReturnSuccess() {
        // Arrange
        Map<String, String> payload = new HashMap<>();
        payload.put("contextualMemory", "I prefer to take my medication in the morning");
        
        when(authentication.getPrincipal()).thenReturn(testUser);

        // Act
        ResponseEntity<?> response = memoryController.addContextualMemory(authentication, payload);

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        verify(memoryService).addManualContextualMemory(testUserId, "I prefer to take my medication in the morning");
    }

    @Test
    void addContextualMemory_WithEmptyContextualMemory_ShouldReturnBadRequest() {
        // Arrange
        Map<String, String> payload = new HashMap<>();
        payload.put("contextualMemory", "");
        
        when(authentication.getPrincipal()).thenReturn(testUser);

        // Act
        ResponseEntity<?> response = memoryController.addContextualMemory(authentication, payload);

        // Assert
        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        verify(memoryService, never()).addManualContextualMemory(anyString(), anyString());
    }

    @Test
    void addContextualMemory_WithNullContextualMemory_ShouldReturnBadRequest() {
        // Arrange
        Map<String, String> payload = new HashMap<>();
        payload.put("contextualMemory", null);
        
        when(authentication.getPrincipal()).thenReturn(testUser);

        // Act
        ResponseEntity<?> response = memoryController.addContextualMemory(authentication, payload);

        // Assert
        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        verify(memoryService, never()).addManualContextualMemory(anyString(), anyString());
    }

    @Test
    void addContextualMemory_WithWhitespaceOnlyContextualMemory_ShouldReturnBadRequest() {
        // Arrange
        Map<String, String> payload = new HashMap<>();
        payload.put("contextualMemory", "   ");
        
        when(authentication.getPrincipal()).thenReturn(testUser);

        // Act
        ResponseEntity<?> response = memoryController.addContextualMemory(authentication, payload);

        // Assert
        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        verify(memoryService, never()).addManualContextualMemory(anyString(), anyString());
    }

    @Test
    void addContextualMemory_WithServiceException_ShouldReturnInternalServerError() {
        // Arrange
        Map<String, String> payload = new HashMap<>();
        payload.put("contextualMemory", "Valid contextual memory");
        
        when(authentication.getPrincipal()).thenReturn(testUser);
        doThrow(new RuntimeException("Service error")).when(memoryService).addManualContextualMemory(anyString(), anyString());

        // Act
        ResponseEntity<?> response = memoryController.addContextualMemory(authentication, payload);

        // Assert
        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, response.getStatusCode());
        verify(memoryService).addManualContextualMemory(testUserId, "Valid contextual memory");
    }

    @Test
    void getCoreInformation_WithValidAuthentication_ShouldReturnCoreInformation() {
        // Arrange
        String expectedCoreInfo = "I am a 65-year-old retired teacher";
        Map<String, Object> expectedResponse = new HashMap<>();
        expectedResponse.put("coreInformation", expectedCoreInfo);
        
        when(authentication.getPrincipal()).thenReturn(testUser);
        when(memoryService.getUserCoreInformation(testUserId)).thenReturn(expectedCoreInfo);

        // Act
        ResponseEntity<?> response = memoryController.getCoreInformation(authentication);

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        verify(memoryService).getUserCoreInformation(testUserId);
    }

    @Test
    void getCoreInformation_WithServiceException_ShouldReturnInternalServerError() {
        // Arrange
        when(authentication.getPrincipal()).thenReturn(testUser);
        when(memoryService.getUserCoreInformation(testUserId)).thenThrow(new RuntimeException("Service error"));

        // Act
        ResponseEntity<?> response = memoryController.getCoreInformation(authentication);

        // Assert
        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, response.getStatusCode());
        verify(memoryService).getUserCoreInformation(testUserId);
    }

    @Test
    void addCoreInformation_WithNullAuthentication_ShouldReturnInternalServerError() {
        // Arrange
        Map<String, String> payload = new HashMap<>();
        payload.put("coreInformation", "Valid core information");
        
        when(authentication.getPrincipal()).thenReturn(null);

        // Act
        ResponseEntity<?> response = memoryController.addCoreInformation(authentication, payload);

        // Assert
        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, response.getStatusCode());
    }

    @Test
    void addContextualMemory_WithNullAuthentication_ShouldReturnInternalServerError() {
        // Arrange
        Map<String, String> payload = new HashMap<>();
        payload.put("contextualMemory", "Valid contextual memory");
        
        when(authentication.getPrincipal()).thenReturn(null);

        // Act
        ResponseEntity<?> response = memoryController.addContextualMemory(authentication, payload);

        // Assert
        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, response.getStatusCode());
    }

    @Test
    void getCoreInformation_WithNullAuthentication_ShouldReturnInternalServerError() {
        // Arrange
        when(authentication.getPrincipal()).thenReturn(null);

        // Act
        ResponseEntity<?> response = memoryController.getCoreInformation(authentication);

        // Assert
        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, response.getStatusCode());
    }

    @Test
    void addCoreInformation_WithNullPayload_ShouldReturnInternalServerError() {
        // Arrange
        when(authentication.getPrincipal()).thenReturn(testUser);

        // Act
        ResponseEntity<?> response = memoryController.addCoreInformation(authentication, null);

        // Assert
        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, response.getStatusCode());
    }

    @Test
    void addContextualMemory_WithNullPayload_ShouldReturnInternalServerError() {
        // Arrange
        when(authentication.getPrincipal()).thenReturn(testUser);

        // Act
        ResponseEntity<?> response = memoryController.addContextualMemory(authentication, null);

        // Assert
        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, response.getStatusCode());
    }
}
