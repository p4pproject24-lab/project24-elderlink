package com.example.ai_companion.service;

import com.example.ai_companion.model.Connection;
import com.example.ai_companion.model.User;
import com.example.ai_companion.repository.ConnectionRepository;
import com.example.ai_companion.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ConnectionServiceTest {

    @Mock
    private ConnectionRepository connectionRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private ConnectionService connectionService;

    private String testCaregiverId;
    private String testElderlyId;
    private String testConnectionId;
    private Connection testConnection;
    private User testCaregiver;
    private User testElderly;

    @BeforeEach
    void setUp() {
        testCaregiverId = "caregiver-firebase-uid";
        testElderlyId = "elderly-firebase-uid";
        testConnectionId = "connection-id-123";

        testConnection = new Connection();
        testConnection.setId(testConnectionId);
        testConnection.setCaregiverId(testCaregiverId);
        testConnection.setElderlyId(testElderlyId);
        testConnection.setStatus("pending");
        testConnection.setCreatedAt(LocalDateTime.now());

        testCaregiver = new User();
        testCaregiver.setId("caregiver-id");
        testCaregiver.setFirebaseUid(testCaregiverId);
        testCaregiver.setElderlyUserIds(new ArrayList<>());

        testElderly = new User();
        testElderly.setId("elderly-id");
        testElderly.setFirebaseUid(testElderlyId);
        testElderly.setCaregiverIds(new ArrayList<>());
    }

    @Test
    void sendConnectionRequest_WithNewRequest_ShouldCreateAndReturnConnection() {
        // Arrange
        when(connectionRepository.findByCaregiverIdAndElderlyId(testCaregiverId, testElderlyId)).thenReturn(null);
        when(connectionRepository.save(any(Connection.class))).thenReturn(testConnection);

        // Act
        Connection result = connectionService.sendConnectionRequest(testCaregiverId, testElderlyId);

        // Assert
        assertNotNull(result);
        assertEquals(testCaregiverId, result.getCaregiverId());
        assertEquals(testElderlyId, result.getElderlyId());
        assertEquals("pending", result.getStatus());
        assertNotNull(result.getCreatedAt());
        verify(connectionRepository).findByCaregiverIdAndElderlyId(testCaregiverId, testElderlyId);
        verify(connectionRepository).save(any(Connection.class));
    }

    @Test
    void sendConnectionRequest_WithExistingPendingRequest_ShouldReturnExistingConnection() {
        // Arrange
        when(connectionRepository.findByCaregiverIdAndElderlyId(testCaregiverId, testElderlyId)).thenReturn(testConnection);

        // Act
        Connection result = connectionService.sendConnectionRequest(testCaregiverId, testElderlyId);

        // Assert
        assertNotNull(result);
        assertEquals(testConnection, result);
        verify(connectionRepository).findByCaregiverIdAndElderlyId(testCaregiverId, testElderlyId);
        verify(connectionRepository, never()).save(any(Connection.class));
    }

    @Test
    void sendConnectionRequest_WithExistingApprovedRequest_ShouldReturnExistingConnection() {
        // Arrange
        testConnection.setStatus("approved");
        when(connectionRepository.findByCaregiverIdAndElderlyId(testCaregiverId, testElderlyId)).thenReturn(testConnection);

        // Act
        Connection result = connectionService.sendConnectionRequest(testCaregiverId, testElderlyId);

        // Assert
        assertNotNull(result);
        assertEquals(testConnection, result);
        verify(connectionRepository).findByCaregiverIdAndElderlyId(testCaregiverId, testElderlyId);
        verify(connectionRepository, never()).save(any(Connection.class));
    }

    @Test
    void sendConnectionRequest_WithExistingRejectedRequest_ShouldCreateNewConnection() {
        // Arrange
        testConnection.setStatus("rejected");
        when(connectionRepository.findByCaregiverIdAndElderlyId(testCaregiverId, testElderlyId)).thenReturn(testConnection);
        when(connectionRepository.save(any(Connection.class))).thenReturn(testConnection);

        // Act
        Connection result = connectionService.sendConnectionRequest(testCaregiverId, testElderlyId);

        // Assert
        assertNotNull(result);
        verify(connectionRepository).findByCaregiverIdAndElderlyId(testCaregiverId, testElderlyId);
        verify(connectionRepository).save(any(Connection.class));
    }

    @Test
    void getPendingRequestsForElderly_WithValidElderlyId_ShouldReturnPendingRequests() {
        // Arrange
        List<Connection> pendingConnections = Arrays.asList(testConnection);
        when(connectionRepository.findByElderlyIdAndStatus(testElderlyId, "pending")).thenReturn(pendingConnections);

        // Act
        List<Connection> result = connectionService.getPendingRequestsForElderly(testElderlyId);

        // Assert
        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals(testConnection, result.get(0));
        verify(connectionRepository).findByElderlyIdAndStatus(testElderlyId, "pending");
    }

    @Test
    void getPendingRequestsForElderly_WithNoPendingRequests_ShouldReturnEmptyList() {
        // Arrange
        when(connectionRepository.findByElderlyIdAndStatus(testElderlyId, "pending")).thenReturn(Collections.emptyList());

        // Act
        List<Connection> result = connectionService.getPendingRequestsForElderly(testElderlyId);

        // Assert
        assertNotNull(result);
        assertTrue(result.isEmpty());
        verify(connectionRepository).findByElderlyIdAndStatus(testElderlyId, "pending");
    }

    @Test
    void approveConnection_WithValidConnectionId_ShouldApproveAndReturnConnection() {
        // Arrange
        when(connectionRepository.findById(testConnectionId)).thenReturn(Optional.of(testConnection));
        when(connectionRepository.save(any(Connection.class))).thenReturn(testConnection);
        when(userRepository.findByFirebaseUid(testCaregiverId)).thenReturn(testCaregiver);
        when(userRepository.findByFirebaseUid(testElderlyId)).thenReturn(testElderly);
        when(userRepository.save(any(User.class))).thenReturn(testCaregiver, testElderly);

        // Act
        Connection result = connectionService.approveConnection(testConnectionId);

        // Assert
        assertNotNull(result);
        assertEquals("approved", result.getStatus());
        assertNotNull(result.getConfirmedAt());
        verify(connectionRepository).findById(testConnectionId);
        verify(connectionRepository).save(testConnection);
        verify(userRepository, atLeast(1)).findByFirebaseUid(testCaregiverId);
        verify(userRepository, atLeast(1)).findByFirebaseUid(testElderlyId);
        verify(userRepository, atLeast(1)).save(any(User.class));
    }

    @Test
    void approveConnection_WithInvalidConnectionId_ShouldReturnNull() {
        // Arrange
        when(connectionRepository.findById(testConnectionId)).thenReturn(Optional.empty());

        // Act
        Connection result = connectionService.approveConnection(testConnectionId);

        // Assert
        assertNull(result);
        verify(connectionRepository).findById(testConnectionId);
        verify(connectionRepository, never()).save(any(Connection.class));
    }

    @Test
    void approveConnection_WithNullConnectionId_ShouldReturnNull() {
        // Arrange
        when(connectionRepository.findById(null)).thenReturn(Optional.empty());

        // Act
        Connection result = connectionService.approveConnection(null);

        // Assert
        assertNull(result);
        verify(connectionRepository).findById(null);
        verify(connectionRepository, never()).save(any(Connection.class));
    }

    @Test
    void rejectConnection_WithValidConnectionId_ShouldRejectAndReturnConnection() {
        // Arrange
        when(connectionRepository.findById(testConnectionId)).thenReturn(Optional.of(testConnection));
        when(connectionRepository.save(any(Connection.class))).thenReturn(testConnection);
        when(userRepository.findByFirebaseUid(testCaregiverId)).thenReturn(testCaregiver);
        when(userRepository.findByFirebaseUid(testElderlyId)).thenReturn(testElderly);
        when(userRepository.save(any(User.class))).thenReturn(testCaregiver, testElderly);

        // Act
        Connection result = connectionService.rejectConnection(testConnectionId);

        // Assert
        assertNotNull(result);
        assertEquals("rejected", result.getStatus());
        assertNotNull(result.getConfirmedAt());
        verify(connectionRepository).findById(testConnectionId);
        verify(connectionRepository).save(testConnection);
        verify(userRepository, atLeast(1)).findByFirebaseUid(testCaregiverId);
        verify(userRepository, atLeast(1)).findByFirebaseUid(testElderlyId);
        verify(userRepository, atLeast(1)).save(any(User.class));
    }

    @Test
    void rejectConnection_WithInvalidConnectionId_ShouldReturnNull() {
        // Arrange
        when(connectionRepository.findById(testConnectionId)).thenReturn(Optional.empty());

        // Act
        Connection result = connectionService.rejectConnection(testConnectionId);

        // Assert
        assertNull(result);
        verify(connectionRepository).findById(testConnectionId);
        verify(connectionRepository, never()).save(any(Connection.class));
    }

    @Test
    void getConnectedElderlyForCaregiver_WithValidCaregiverId_ShouldReturnElderlyUsers() {
        // Arrange
        List<Connection> approvedConnections = Arrays.asList(testConnection);
        when(connectionRepository.findByCaregiverIdAndStatus(testCaregiverId, "approved")).thenReturn(approvedConnections);
        when(userRepository.findByFirebaseUid(testElderlyId)).thenReturn(testElderly);

        // Act
        List<User> result = connectionService.getConnectedElderlyForCaregiver(testCaregiverId);

        // Assert
        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals(testElderly, result.get(0));
        verify(connectionRepository).findByCaregiverIdAndStatus(testCaregiverId, "approved");
        verify(userRepository).findByFirebaseUid(testElderlyId);
    }

    @Test
    void getConnectedElderlyForCaregiver_WithNoConnections_ShouldReturnEmptyList() {
        // Arrange
        when(connectionRepository.findByCaregiverIdAndStatus(testCaregiverId, "approved")).thenReturn(Collections.emptyList());

        // Act
        List<User> result = connectionService.getConnectedElderlyForCaregiver(testCaregiverId);

        // Assert
        assertNotNull(result);
        assertTrue(result.isEmpty());
        verify(connectionRepository).findByCaregiverIdAndStatus(testCaregiverId, "approved");
        verify(userRepository, never()).findByFirebaseUid(anyString());
    }

    @Test
    void getConnectedElderlyForCaregiver_WithNullUser_ShouldFilterOutNull() {
        // Arrange
        List<Connection> approvedConnections = Arrays.asList(testConnection);
        when(connectionRepository.findByCaregiverIdAndStatus(testCaregiverId, "approved")).thenReturn(approvedConnections);
        when(userRepository.findByFirebaseUid(testElderlyId)).thenReturn(null);

        // Act
        List<User> result = connectionService.getConnectedElderlyForCaregiver(testCaregiverId);

        // Assert
        assertNotNull(result);
        assertTrue(result.isEmpty());
        verify(connectionRepository).findByCaregiverIdAndStatus(testCaregiverId, "approved");
        verify(userRepository).findByFirebaseUid(testElderlyId);
    }

    @Test
    void getConnectedCaregiversForElderly_WithValidElderlyId_ShouldReturnCaregiverUsers() {
        // Arrange
        List<Connection> approvedConnections = Arrays.asList(testConnection);
        when(connectionRepository.findByElderlyIdAndStatus(testElderlyId, "approved")).thenReturn(approvedConnections);
        when(userRepository.findByFirebaseUid(testCaregiverId)).thenReturn(testCaregiver);

        // Act
        List<User> result = connectionService.getConnectedCaregiversForElderly(testElderlyId);

        // Assert
        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals(testCaregiver, result.get(0));
        verify(connectionRepository).findByElderlyIdAndStatus(testElderlyId, "approved");
        verify(userRepository).findByFirebaseUid(testCaregiverId);
    }

    @Test
    void getConnectedCaregiversForElderly_WithNoConnections_ShouldReturnEmptyList() {
        // Arrange
        when(connectionRepository.findByElderlyIdAndStatus(testElderlyId, "approved")).thenReturn(Collections.emptyList());

        // Act
        List<User> result = connectionService.getConnectedCaregiversForElderly(testElderlyId);

        // Assert
        assertNotNull(result);
        assertTrue(result.isEmpty());
        verify(connectionRepository).findByElderlyIdAndStatus(testElderlyId, "approved");
        verify(userRepository, never()).findByFirebaseUid(anyString());
    }

    @Test
    void getConnectedCaregiversForElderly_WithNullUser_ShouldFilterOutNull() {
        // Arrange
        List<Connection> approvedConnections = Arrays.asList(testConnection);
        when(connectionRepository.findByElderlyIdAndStatus(testElderlyId, "approved")).thenReturn(approvedConnections);
        when(userRepository.findByFirebaseUid(testCaregiverId)).thenReturn(null);

        // Act
        List<User> result = connectionService.getConnectedCaregiversForElderly(testElderlyId);

        // Assert
        assertNotNull(result);
        assertTrue(result.isEmpty());
        verify(connectionRepository).findByElderlyIdAndStatus(testElderlyId, "approved");
        verify(userRepository).findByFirebaseUid(testCaregiverId);
    }

    @Test
    void removeConnection_WithExistingConnection_ShouldRemoveAndReturnTrue() {
        // Arrange
        when(connectionRepository.findByCaregiverIdAndElderlyId(testCaregiverId, testElderlyId)).thenReturn(testConnection);
        when(userRepository.findByFirebaseUid(testCaregiverId)).thenReturn(testCaregiver);
        when(userRepository.findByFirebaseUid(testElderlyId)).thenReturn(testElderly);
        when(userRepository.save(any(User.class))).thenReturn(testCaregiver, testElderly);

        // Act
        boolean result = connectionService.removeConnection(testCaregiverId, testElderlyId);

        // Assert
        assertTrue(result);
        verify(connectionRepository).findByCaregiverIdAndElderlyId(testCaregiverId, testElderlyId);
        verify(connectionRepository).delete(testConnection);
        verify(userRepository, atLeast(1)).findByFirebaseUid(testCaregiverId);
        verify(userRepository, atLeast(1)).findByFirebaseUid(testElderlyId);
        verify(userRepository, atLeast(1)).save(any(User.class));
    }

    @Test
    void removeConnection_WithNonExistingConnection_ShouldReturnFalse() {
        // Arrange
        when(connectionRepository.findByCaregiverIdAndElderlyId(testCaregiverId, testElderlyId)).thenReturn(null);

        // Act
        boolean result = connectionService.removeConnection(testCaregiverId, testElderlyId);

        // Assert
        assertFalse(result);
        verify(connectionRepository).findByCaregiverIdAndElderlyId(testCaregiverId, testElderlyId);
        verify(connectionRepository, never()).delete(any(Connection.class));
        verify(userRepository, never()).findByFirebaseUid(anyString());
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void getUserById_WithValidFirebaseUid_ShouldReturnUser() {
        // Arrange
        when(userRepository.findByFirebaseUid(testCaregiverId)).thenReturn(testCaregiver);

        // Act
        User result = connectionService.getUserById(testCaregiverId);

        // Assert
        assertNotNull(result);
        assertEquals(testCaregiver, result);
        verify(userRepository).findByFirebaseUid(testCaregiverId);
    }

    @Test
    void getUserById_WithInvalidFirebaseUid_ShouldReturnNull() {
        // Arrange
        when(userRepository.findByFirebaseUid("invalid-uid")).thenReturn(null);

        // Act
        User result = connectionService.getUserById("invalid-uid");

        // Assert
        assertNull(result);
        verify(userRepository).findByFirebaseUid("invalid-uid");
    }

    @Test
    void getUserById_WithNullFirebaseUid_ShouldReturnNull() {
        // Arrange
        when(userRepository.findByFirebaseUid(null)).thenReturn(null);

        // Act
        User result = connectionService.getUserById(null);

        // Assert
        assertNull(result);
        verify(userRepository).findByFirebaseUid(null);
    }

    @Test
    void approveConnection_WithUserUpdateException_ShouldStillReturnConnection() {
        // Arrange
        when(connectionRepository.findById(testConnectionId)).thenReturn(Optional.of(testConnection));
        when(connectionRepository.save(any(Connection.class))).thenReturn(testConnection);
        when(userRepository.findByFirebaseUid(testCaregiverId)).thenThrow(new RuntimeException("Database error"));

        // Act
        Connection result = connectionService.approveConnection(testConnectionId);

        // Assert
        assertNotNull(result);
        assertEquals("approved", result.getStatus());
        verify(connectionRepository).findById(testConnectionId);
        verify(connectionRepository).save(testConnection);
    }

    @Test
    void rejectConnection_WithUserUpdateException_ShouldStillReturnConnection() {
        // Arrange
        when(connectionRepository.findById(testConnectionId)).thenReturn(Optional.of(testConnection));
        when(connectionRepository.save(any(Connection.class))).thenReturn(testConnection);
        when(userRepository.findByFirebaseUid(testCaregiverId)).thenThrow(new RuntimeException("Database error"));

        // Act
        Connection result = connectionService.rejectConnection(testConnectionId);

        // Assert
        assertNotNull(result);
        assertEquals("rejected", result.getStatus());
        verify(connectionRepository).findById(testConnectionId);
        verify(connectionRepository).save(testConnection);
    }

    @Test
    void removeConnection_WithUserUpdateException_ShouldStillReturnTrue() {
        // Arrange
        when(connectionRepository.findByCaregiverIdAndElderlyId(testCaregiverId, testElderlyId)).thenReturn(testConnection);
        when(userRepository.findByFirebaseUid(testCaregiverId)).thenThrow(new RuntimeException("Database error"));

        // Act
        boolean result = connectionService.removeConnection(testCaregiverId, testElderlyId);

        // Assert
        assertTrue(result);
        verify(connectionRepository).findByCaregiverIdAndElderlyId(testCaregiverId, testElderlyId);
        verify(connectionRepository).delete(testConnection);
    }

    @Test
    void approveConnection_WithNullCaregiver_ShouldStillUpdateElderly() {
        // Arrange
        when(connectionRepository.findById(testConnectionId)).thenReturn(Optional.of(testConnection));
        when(connectionRepository.save(any(Connection.class))).thenReturn(testConnection);
        when(userRepository.findByFirebaseUid(testCaregiverId)).thenReturn(null);
        when(userRepository.findByFirebaseUid(testElderlyId)).thenReturn(testElderly);
        when(userRepository.save(any(User.class))).thenReturn(testElderly);

        // Act
        Connection result = connectionService.approveConnection(testConnectionId);

        // Assert
        assertNotNull(result);
        assertEquals("approved", result.getStatus());
        verify(connectionRepository).findById(testConnectionId);
        verify(connectionRepository).save(testConnection);
        verify(userRepository).findByFirebaseUid(testCaregiverId);
        verify(userRepository).findByFirebaseUid(testElderlyId);
        verify(userRepository).save(testElderly);
    }

    @Test
    void approveConnection_WithNullElderly_ShouldStillUpdateCaregiver() {
        // Arrange
        when(connectionRepository.findById(testConnectionId)).thenReturn(Optional.of(testConnection));
        when(connectionRepository.save(any(Connection.class))).thenReturn(testConnection);
        when(userRepository.findByFirebaseUid(testCaregiverId)).thenReturn(testCaregiver);
        when(userRepository.findByFirebaseUid(testElderlyId)).thenReturn(null);
        when(userRepository.save(any(User.class))).thenReturn(testCaregiver);

        // Act
        Connection result = connectionService.approveConnection(testConnectionId);

        // Assert
        assertNotNull(result);
        assertEquals("approved", result.getStatus());
        verify(connectionRepository).findById(testConnectionId);
        verify(connectionRepository).save(testConnection);
        verify(userRepository).findByFirebaseUid(testCaregiverId);
        verify(userRepository).findByFirebaseUid(testElderlyId);
        verify(userRepository).save(testCaregiver);
    }
}
