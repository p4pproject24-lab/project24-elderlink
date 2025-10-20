package com.example.ai_companion.controller;

import com.example.ai_companion.model.GameMessage;
import com.example.ai_companion.model.GameSession;
import com.example.ai_companion.service.GameService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.time.Instant;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class GameControllerTest {

    @Mock
    private GameService gameService;

    @InjectMocks
    private GameController gameController;

    private String testUserId;
    private String testSessionId;
    private GameSession testGameSession;
    private GameMessage testGameMessage;

    @BeforeEach
    void setUp() {
        testUserId = "user123";
        testSessionId = "session123";

        testGameSession = new GameSession(testUserId, "Memory Game", "A cognitive memory game", "generated", "Test prompt");
        testGameSession.setId(testSessionId);

        testGameMessage = new GameMessage(testSessionId, testUserId, "Hello", true, Instant.now());
        testGameMessage.setId("msg123");
    }

    @Test
    void generateGamePreview_WithValidUserId_ShouldReturnPreview() {
        // Arrange
        Map<String, String> preview = new HashMap<>();
        preview.put("title", "Memory Challenge");
        preview.put("description", "Test your memory skills");
        preview.put("difficulty", "Medium");

        when(gameService.generateGamePreview(testUserId)).thenReturn(preview);

        // Act
        ResponseEntity<Map<String, String>> response = gameController.generateGamePreview(testUserId);

        // Assert
        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(preview, response.getBody());
        verify(gameService).generateGamePreview(testUserId);
    }

    @Test
    void generateGamePreview_WithEmptyPreview_ShouldReturnEmptyMap() {
        // Arrange
        Map<String, String> preview = new HashMap<>();
        when(gameService.generateGamePreview(testUserId)).thenReturn(preview);

        // Act
        ResponseEntity<Map<String, String>> response = gameController.generateGamePreview(testUserId);

        // Assert
        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertTrue(response.getBody().isEmpty());
        verify(gameService).generateGamePreview(testUserId);
    }

    @Test
    void createGameSession_WithGeneratedGameType_ShouldReturnSession() {
        // Arrange
        Map<String, String> payload = new HashMap<>();
        payload.put("gameType", "generated");
        payload.put("userDescription", "I want a memory game");

        when(gameService.createGameSession(testUserId, "generated", "I want a memory game"))
                .thenReturn(testGameSession);

        // Act
        ResponseEntity<GameSession> response = gameController.createGameSession(testUserId, payload);

        // Assert
        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(testGameSession, response.getBody());
        verify(gameService).createGameSession(testUserId, "generated", "I want a memory game");
    }

    @Test
    void createGameSession_WithCustomGameType_ShouldReturnSession() {
        // Arrange
        Map<String, String> payload = new HashMap<>();
        payload.put("gameType", "custom");
        payload.put("userDescription", "Create a word puzzle game");

        GameSession customSession = new GameSession(testUserId, "Word Puzzle", "Custom word puzzle game", "custom", "Create a word puzzle game");
        customSession.setId("custom123");

        when(gameService.createGameSession(testUserId, "custom", "Create a word puzzle game"))
                .thenReturn(customSession);

        // Act
        ResponseEntity<GameSession> response = gameController.createGameSession(testUserId, payload);

        // Assert
        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(customSession, response.getBody());
        verify(gameService).createGameSession(testUserId, "custom", "Create a word puzzle game");
    }

    @Test
    void createGameSession_WithNullGameType_ShouldReturnSession() {
        // Arrange
        Map<String, String> payload = new HashMap<>();
        payload.put("gameType", null);
        payload.put("userDescription", "Test description");

        when(gameService.createGameSession(testUserId, null, "Test description"))
                .thenReturn(testGameSession);

        // Act
        ResponseEntity<GameSession> response = gameController.createGameSession(testUserId, payload);

        // Assert
        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(testGameSession, response.getBody());
        verify(gameService).createGameSession(testUserId, null, "Test description");
    }

    @Test
    void getUserGameSessions_WithValidUserId_ShouldReturnSessions() {
        // Arrange
        List<GameSession> sessions = Arrays.asList(testGameSession);
        when(gameService.getUserGameSessions(testUserId)).thenReturn(sessions);

        // Act
        ResponseEntity<List<GameSession>> response = gameController.getUserGameSessions(testUserId);

        // Assert
        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(1, response.getBody().size());
        assertEquals(testGameSession, response.getBody().get(0));
        verify(gameService).getUserGameSessions(testUserId);
    }

    @Test
    void getUserGameSessions_WithEmptyList_ShouldReturnEmptyList() {
        // Arrange
        when(gameService.getUserGameSessions(testUserId)).thenReturn(new ArrayList<>());

        // Act
        ResponseEntity<List<GameSession>> response = gameController.getUserGameSessions(testUserId);

        // Assert
        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertTrue(response.getBody().isEmpty());
        verify(gameService).getUserGameSessions(testUserId);
    }

    @Test
    void getGameSession_WithValidSessionId_ShouldReturnSession() {
        // Arrange
        when(gameService.getGameSession(testSessionId)).thenReturn(testGameSession);

        // Act
        ResponseEntity<GameSession> response = gameController.getGameSession(testSessionId);

        // Assert
        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(testGameSession, response.getBody());
        verify(gameService).getGameSession(testSessionId);
    }

    @Test
    void getGameSession_WithNonExistentSession_ShouldReturnNotFound() {
        // Arrange
        when(gameService.getGameSession(testSessionId)).thenReturn(null);

        // Act
        ResponseEntity<GameSession> response = gameController.getGameSession(testSessionId);

        // Assert
        assertNotNull(response);
        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
        verify(gameService).getGameSession(testSessionId);
    }

    @Test
    void sendGameMessage_WithValidInput_ShouldReturnResponse() {
        // Arrange
        Map<String, String> payload = new HashMap<>();
        payload.put("message", "Let's start the game");

        String gameResponse = "Great! Let's begin with the first challenge.";
        when(gameService.processGameMessage(testSessionId, testUserId, "Let's start the game"))
                .thenReturn(gameResponse);

        // Act
        ResponseEntity<String> response = gameController.sendGameMessage(testSessionId, testUserId, payload);

        // Assert
        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(gameResponse, response.getBody());
        verify(gameService).processGameMessage(testSessionId, testUserId, "Let's start the game");
    }

    @Test
    void sendGameMessage_WithNullMessage_ShouldReturnResponse() {
        // Arrange
        Map<String, String> payload = new HashMap<>();
        payload.put("message", null);

        String gameResponse = "I didn't understand that. Can you try again?";
        when(gameService.processGameMessage(testSessionId, testUserId, null))
                .thenReturn(gameResponse);

        // Act
        ResponseEntity<String> response = gameController.sendGameMessage(testSessionId, testUserId, payload);

        // Assert
        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(gameResponse, response.getBody());
        verify(gameService).processGameMessage(testSessionId, testUserId, null);
    }

    @Test
    void getGameMessages_WithValidInput_ShouldReturnMessages() {
        // Arrange
        List<GameMessage> messages = Arrays.asList(testGameMessage);
        when(gameService.getGameMessages(testSessionId, 0, 50)).thenReturn(messages);

        // Act
        ResponseEntity<List<GameMessage>> response = gameController.getGameMessages(testSessionId, 0, 50);

        // Assert
        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(1, response.getBody().size());
        assertEquals(testGameMessage, response.getBody().get(0));
        verify(gameService).getGameMessages(testSessionId, 0, 50);
    }

    @Test
    void getGameMessages_WithDefaultPagination_ShouldReturnMessages() {
        // Arrange
        List<GameMessage> messages = Arrays.asList(testGameMessage);
        when(gameService.getGameMessages(testSessionId, 0, 50)).thenReturn(messages);

        // Act
        ResponseEntity<List<GameMessage>> response = gameController.getGameMessages(testSessionId, 0, 50);

        // Assert
        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(1, response.getBody().size());
        verify(gameService).getGameMessages(testSessionId, 0, 50);
    }

    @Test
    void getGameMessages_WithEmptyList_ShouldReturnEmptyList() {
        // Arrange
        when(gameService.getGameMessages(testSessionId, 0, 50)).thenReturn(new ArrayList<>());

        // Act
        ResponseEntity<List<GameMessage>> response = gameController.getGameMessages(testSessionId, 0, 50);

        // Assert
        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertTrue(response.getBody().isEmpty());
        verify(gameService).getGameMessages(testSessionId, 0, 50);
    }

    @Test
    void deleteGameSession_WithValidSessionId_ShouldReturnNoContent() {
        // Arrange
        doNothing().when(gameService).deleteGameSession(testSessionId);

        // Act
        ResponseEntity<Void> response = gameController.deleteGameSession(testSessionId);

        // Assert
        assertNotNull(response);
        assertEquals(HttpStatus.NO_CONTENT, response.getStatusCode());
        verify(gameService).deleteGameSession(testSessionId);
    }

    @Test
    void generateGamePreview_WithDifferentUser_ShouldReturnPreview() {
        // Arrange
        String differentUserId = "user456";
        Map<String, String> preview = new HashMap<>();
        preview.put("title", "Math Challenge");
        preview.put("description", "Test your math skills");
        preview.put("difficulty", "Hard");

        when(gameService.generateGamePreview(differentUserId)).thenReturn(preview);

        // Act
        ResponseEntity<Map<String, String>> response = gameController.generateGamePreview(differentUserId);

        // Assert
        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(preview, response.getBody());
        verify(gameService).generateGamePreview(differentUserId);
    }

    @Test
    void createGameSession_WithEmptyPayload_ShouldHandleGracefully() {
        // Arrange
        Map<String, String> payload = new HashMap<>();

        when(gameService.createGameSession(testUserId, null, null))
                .thenReturn(testGameSession);

        // Act
        ResponseEntity<GameSession> response = gameController.createGameSession(testUserId, payload);

        // Assert
        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(testGameSession, response.getBody());
        verify(gameService).createGameSession(testUserId, null, null);
    }

    @Test
    void getUserGameSessions_WithMultipleSessions_ShouldReturnAll() {
        // Arrange
        GameSession session1 = new GameSession(testUserId, "Memory Game 1", "Description 1", "generated", "Prompt 1");
        session1.setId("session1");

        GameSession session2 = new GameSession(testUserId, "Memory Game 2", "Description 2", "custom", "Prompt 2");
        session2.setId("session2");

        List<GameSession> sessions = Arrays.asList(session1, session2);
        when(gameService.getUserGameSessions(testUserId)).thenReturn(sessions);

        // Act
        ResponseEntity<List<GameSession>> response = gameController.getUserGameSessions(testUserId);

        // Assert
        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(2, response.getBody().size());
        assertEquals(session1, response.getBody().get(0));
        assertEquals(session2, response.getBody().get(1));
        verify(gameService).getUserGameSessions(testUserId);
    }

    @Test
    void getGameMessages_WithCustomPagination_ShouldReturnMessages() {
        // Arrange
        List<GameMessage> messages = Arrays.asList(testGameMessage);
        when(gameService.getGameMessages(testSessionId, 2, 10)).thenReturn(messages);

        // Act
        ResponseEntity<List<GameMessage>> response = gameController.getGameMessages(testSessionId, 2, 10);

        // Assert
        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(1, response.getBody().size());
        verify(gameService).getGameMessages(testSessionId, 2, 10);
    }

    @Test
    void sendGameMessage_WithEmptyMessage_ShouldReturnResponse() {
        // Arrange
        Map<String, String> payload = new HashMap<>();
        payload.put("message", "");

        String gameResponse = "Please provide a message to continue the game.";
        when(gameService.processGameMessage(testSessionId, testUserId, ""))
                .thenReturn(gameResponse);

        // Act
        ResponseEntity<String> response = gameController.sendGameMessage(testSessionId, testUserId, payload);

        // Assert
        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(gameResponse, response.getBody());
        verify(gameService).processGameMessage(testSessionId, testUserId, "");
    }
}
