package com.example.ai_companion.controller;

import com.example.ai_companion.model.Connection;
import com.example.ai_companion.model.User;
import com.example.ai_companion.service.ConnectionService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ConnectionControllerTest {

    @Mock
    private ConnectionService connectionService;

    @Mock
    private SimpMessagingTemplate messagingTemplate;

    @InjectMocks
    private ConnectionController connectionController;

    private String caregiverId;
    private String elderlyId;
    private Connection testConnection;
    private User testCaregiver;
    private User testElderly;

    @BeforeEach
    void setUp() {
        caregiverId = "caregiver123";
        elderlyId = "elderly123";

        testCaregiver = new User();
        testCaregiver.setId("caregiver123");
        testCaregiver.setFirebaseUid("firebase_caregiver123");
        testCaregiver.setFullName("John Caregiver");
        testCaregiver.setEmail("caregiver@example.com");
        testCaregiver.setProfileImageUrl("http://example.com/caregiver.jpg");

        testElderly = new User();
        testElderly.setId("elderly123");
        testElderly.setFirebaseUid("firebase_elderly123");
        testElderly.setFullName("Jane Elderly");
        testElderly.setEmail("elderly@example.com");
        testElderly.setProfileImageUrl("http://example.com/elderly.jpg");

        testConnection = new Connection();
        testConnection.setId("conn123");
        testConnection.setCaregiverId(caregiverId);
        testConnection.setElderlyId(elderlyId);
        testConnection.setStatus("pending");
        testConnection.setCreatedAt(java.time.LocalDateTime.now());
    }

    @Test
    void sendConnectionRequest_WithValidInput_ShouldReturnSuccess() {
        // Arrange
        when(connectionService.sendConnectionRequest(caregiverId, elderlyId)).thenReturn(testConnection);
        when(connectionService.getUserById(caregiverId)).thenReturn(testCaregiver);

        // Act
        ResponseEntity<?> response = connectionController.sendConnectionRequest(caregiverId, elderlyId);

        // Assert
        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertTrue(response.getBody() instanceof Map);
        
        @SuppressWarnings("unchecked")
        Map<String, Object> responseBody = (Map<String, Object>) response.getBody();
        assertTrue((Boolean) responseBody.get("success"));
        assertEquals(testConnection, responseBody.get("connection"));
        
        verify(messagingTemplate).convertAndSend(eq("/topic/elderly-" + elderlyId), any(Map.class));
    }

    @Test
    void sendConnectionRequest_WithNullCaregiver_ShouldReturnSuccess() {
        // Arrange
        when(connectionService.sendConnectionRequest(caregiverId, elderlyId)).thenReturn(testConnection);
        when(connectionService.getUserById(caregiverId)).thenReturn(null);

        // Act
        ResponseEntity<?> response = connectionController.sendConnectionRequest(caregiverId, elderlyId);

        // Assert
        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertTrue(response.getBody() instanceof Map);
        
        @SuppressWarnings("unchecked")
        Map<String, Object> responseBody = (Map<String, Object>) response.getBody();
        assertTrue((Boolean) responseBody.get("success"));
        assertEquals(testConnection, responseBody.get("connection"));
    }

    @Test
    void getPendingRequestsForElderly_WithValidInput_ShouldReturnPendingRequests() {
        // Arrange
        List<Connection> pendingConnections = Arrays.asList(testConnection);
        when(connectionService.getPendingRequestsForElderly(elderlyId)).thenReturn(pendingConnections);
        when(connectionService.getUserById(caregiverId)).thenReturn(testCaregiver);

        // Act
        ResponseEntity<?> response = connectionController.getPendingRequestsForElderly(elderlyId);

        // Assert
        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertTrue(response.getBody() instanceof List);
        
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> responseBody = (List<Map<String, Object>>) response.getBody();
        assertEquals(1, responseBody.size());
        
        Map<String, Object> connectionData = responseBody.get(0);
        assertEquals(testConnection.getId(), connectionData.get("id"));
        assertEquals(testConnection.getStatus(), connectionData.get("status"));
        assertEquals(testConnection.getCreatedAt(), connectionData.get("createdAt"));
        assertEquals(testConnection.getCaregiverId(), connectionData.get("caregiverId"));
        assertEquals(testCaregiver.getFirebaseUid(), connectionData.get("caregiverUsername"));
        assertEquals(testCaregiver.getEmail(), connectionData.get("caregiverEmail"));
        assertEquals(testCaregiver.getFullName(), connectionData.get("caregiverFullName"));
        assertEquals(testCaregiver.getProfileImageUrl(), connectionData.get("caregiverProfileImageUrl"));
    }

    @Test
    void getPendingRequestsForElderly_WithEmptyList_ShouldReturnEmptyList() {
        // Arrange
        when(connectionService.getPendingRequestsForElderly(elderlyId)).thenReturn(new ArrayList<>());

        // Act
        ResponseEntity<?> response = connectionController.getPendingRequestsForElderly(elderlyId);

        // Assert
        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertTrue(response.getBody() instanceof List);
        
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> responseBody = (List<Map<String, Object>>) response.getBody();
        assertTrue(responseBody.isEmpty());
    }

    @Test
    void approveConnection_WithValidConnection_ShouldReturnSuccess() {
        // Arrange
        testConnection.setStatus("approved");
        testConnection.setConfirmedAt(java.time.LocalDateTime.now());
        when(connectionService.approveConnection("conn123")).thenReturn(testConnection);

        // Act
        ResponseEntity<?> response = connectionController.approveConnection("conn123");

        // Assert
        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertTrue(response.getBody() instanceof Map);
        
        @SuppressWarnings("unchecked")
        Map<String, Object> responseBody = (Map<String, Object>) response.getBody();
        assertTrue((Boolean) responseBody.get("success"));
        assertEquals(testConnection, responseBody.get("connection"));
        
        verify(messagingTemplate).convertAndSend(eq("/topic/caregiver-" + testConnection.getCaregiverId()), any(Map.class));
    }

    @Test
    void approveConnection_WithNullConnection_ShouldReturnFailure() {
        // Arrange
        when(connectionService.approveConnection("conn123")).thenReturn(null);

        // Act
        ResponseEntity<?> response = connectionController.approveConnection("conn123");

        // Assert
        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertTrue(response.getBody() instanceof Map);
        
        @SuppressWarnings("unchecked")
        Map<String, Object> responseBody = (Map<String, Object>) response.getBody();
        assertFalse((Boolean) responseBody.get("success"));
        assertNull(responseBody.get("connection"));
        
        verify(messagingTemplate, never()).convertAndSend(anyString(), any(Map.class));
    }

    @Test
    void rejectConnection_WithValidConnection_ShouldReturnSuccess() {
        // Arrange
        testConnection.setStatus("rejected");
        testConnection.setConfirmedAt(java.time.LocalDateTime.now());
        when(connectionService.rejectConnection("conn123")).thenReturn(testConnection);

        // Act
        ResponseEntity<?> response = connectionController.rejectConnection("conn123");

        // Assert
        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertTrue(response.getBody() instanceof Map);
        
        @SuppressWarnings("unchecked")
        Map<String, Object> responseBody = (Map<String, Object>) response.getBody();
        assertTrue((Boolean) responseBody.get("success"));
        assertEquals(testConnection, responseBody.get("connection"));
        
        verify(messagingTemplate).convertAndSendToUser(
            eq(testConnection.getCaregiverId()),
            eq("/queue/connection-approvals"),
            any(Map.class)
        );
    }

    @Test
    void rejectConnection_WithNullConnection_ShouldReturnFailure() {
        // Arrange
        when(connectionService.rejectConnection("conn123")).thenReturn(null);

        // Act
        ResponseEntity<?> response = connectionController.rejectConnection("conn123");

        // Assert
        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertTrue(response.getBody() instanceof Map);
        
        @SuppressWarnings("unchecked")
        Map<String, Object> responseBody = (Map<String, Object>) response.getBody();
        assertFalse((Boolean) responseBody.get("success"));
        assertNull(responseBody.get("connection"));
        
        verify(messagingTemplate, never()).convertAndSendToUser(anyString(), anyString(), any(Map.class));
    }

    @Test
    void getConnectedElderlyForCaregiver_WithValidInput_ShouldReturnElderlyList() {
        // Arrange
        List<User> elderlyList = Arrays.asList(testElderly);
        when(connectionService.getConnectedElderlyForCaregiver(caregiverId)).thenReturn(elderlyList);

        // Act
        ResponseEntity<?> response = connectionController.getConnectedElderlyForCaregiver(caregiverId);

        // Assert
        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(elderlyList, response.getBody());
    }

    @Test
    void getConnectedElderlyForCaregiver_WithEmptyList_ShouldReturnEmptyList() {
        // Arrange
        when(connectionService.getConnectedElderlyForCaregiver(caregiverId)).thenReturn(new ArrayList<>());

        // Act
        ResponseEntity<?> response = connectionController.getConnectedElderlyForCaregiver(caregiverId);

        // Assert
        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertTrue(response.getBody() instanceof List);
        
        @SuppressWarnings("unchecked")
        List<User> responseBody = (List<User>) response.getBody();
        assertTrue(responseBody.isEmpty());
    }

    @Test
    void getConnectedCaregiversForElderly_WithValidInput_ShouldReturnCaregiverList() {
        // Arrange
        List<User> caregiverList = Arrays.asList(testCaregiver);
        when(connectionService.getConnectedCaregiversForElderly(elderlyId)).thenReturn(caregiverList);

        // Act
        ResponseEntity<?> response = connectionController.getConnectedCaregiversForElderly(elderlyId);

        // Assert
        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(caregiverList, response.getBody());
    }

    @Test
    void getConnectedCaregiversForElderly_WithEmptyList_ShouldReturnEmptyList() {
        // Arrange
        when(connectionService.getConnectedCaregiversForElderly(elderlyId)).thenReturn(new ArrayList<>());

        // Act
        ResponseEntity<?> response = connectionController.getConnectedCaregiversForElderly(elderlyId);

        // Assert
        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertTrue(response.getBody() instanceof List);
        
        @SuppressWarnings("unchecked")
        List<User> responseBody = (List<User>) response.getBody();
        assertTrue(responseBody.isEmpty());
    }

    @Test
    void unsyncConnection_WithExistingConnection_ShouldReturnSuccess() {
        // Arrange
        when(connectionService.removeConnection(caregiverId, elderlyId)).thenReturn(true);

        // Act
        ResponseEntity<?> response = connectionController.unsyncConnection(caregiverId, elderlyId);

        // Assert
        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertTrue(response.getBody() instanceof Map);
        
        @SuppressWarnings("unchecked")
        Map<String, Object> responseBody = (Map<String, Object>) response.getBody();
        assertTrue((Boolean) responseBody.get("success"));
    }

    @Test
    void unsyncConnection_WithNonExistentConnection_ShouldReturnNotFound() {
        // Arrange
        when(connectionService.removeConnection(caregiverId, elderlyId)).thenReturn(false);

        // Act
        ResponseEntity<?> response = connectionController.unsyncConnection(caregiverId, elderlyId);

        // Assert
        assertNotNull(response);
        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
        assertTrue(response.getBody() instanceof Map);
        
        @SuppressWarnings("unchecked")
        Map<String, Object> responseBody = (Map<String, Object>) response.getBody();
        assertFalse((Boolean) responseBody.get("success"));
        assertEquals("Connection not found", responseBody.get("error"));
    }

    @Test
    void getPendingRequestsForElderly_WithNullCaregiver_ShouldHandleGracefully() {
        // Arrange
        List<Connection> pendingConnections = Arrays.asList(testConnection);
        when(connectionService.getPendingRequestsForElderly(elderlyId)).thenReturn(pendingConnections);
        when(connectionService.getUserById(caregiverId)).thenReturn(null);

        // Act
        ResponseEntity<?> response = connectionController.getPendingRequestsForElderly(elderlyId);

        // Assert
        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertTrue(response.getBody() instanceof List);
        
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> responseBody = (List<Map<String, Object>>) response.getBody();
        assertEquals(1, responseBody.size());
        
        Map<String, Object> connectionData = responseBody.get(0);
        assertEquals(testConnection.getId(), connectionData.get("id"));
        assertEquals(testConnection.getStatus(), connectionData.get("status"));
        assertEquals(testConnection.getCreatedAt(), connectionData.get("createdAt"));
        assertEquals(testConnection.getCaregiverId(), connectionData.get("caregiverId"));
        assertNull(connectionData.get("caregiverUsername"));
        assertNull(connectionData.get("caregiverEmail"));
        assertNull(connectionData.get("caregiverFullName"));
        assertNull(connectionData.get("caregiverProfileImageUrl"));
    }

    @Test
    void sendConnectionRequest_WithCaregiverHavingNullFields_ShouldHandleGracefully() {
        // Arrange
        testCaregiver.setFullName(null);
        testCaregiver.setProfileImageUrl(null);
        
        when(connectionService.sendConnectionRequest(caregiverId, elderlyId)).thenReturn(testConnection);
        when(connectionService.getUserById(caregiverId)).thenReturn(testCaregiver);

        // Act
        ResponseEntity<?> response = connectionController.sendConnectionRequest(caregiverId, elderlyId);

        // Assert
        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertTrue(response.getBody() instanceof Map);
        
        @SuppressWarnings("unchecked")
        Map<String, Object> responseBody = (Map<String, Object>) response.getBody();
        assertTrue((Boolean) responseBody.get("success"));
        assertEquals(testConnection, responseBody.get("connection"));
        
        verify(messagingTemplate).convertAndSend(eq("/topic/elderly-" + elderlyId), any(Map.class));
    }
}
