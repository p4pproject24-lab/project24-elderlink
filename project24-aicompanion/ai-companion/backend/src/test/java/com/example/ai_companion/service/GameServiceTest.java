package com.example.ai_companion.service;

import com.example.ai_companion.model.GameMessage;
import com.example.ai_companion.model.GameSession;
import com.example.ai_companion.model.User;
import com.example.ai_companion.repository.GameMessageRepository;
import com.example.ai_companion.repository.GameSessionRepository;
import com.example.ai_companion.repository.UserRepository;
import dev.langchain4j.model.chat.ChatLanguageModel;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class GameServiceTest {

    @Mock
    private ChatLanguageModel gemini;

    @Mock
    private GameSessionRepository gameSessionRepository;

    @Mock
    private GameMessageRepository gameMessageRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private GameService gameService;

    private User testUser;
    private GameSession testGameSession;
    private GameMessage testGameMessage;
    private String testUserId;
    private String testSessionId;

    @BeforeEach
    void setUp() {
        testUserId = "user123";
        testSessionId = "session123";

        testUser = new User();
        testUser.setId(testUserId);
        testUser.setFirebaseUid("firebase123");
        testUser.setEmail("test@example.com");
        testUser.setFullName("Test User");
        testUser.setCoreInformation("Test core information");

        testGameSession = new GameSession(testUserId, "Memory Game", "A cognitive memory game", "generated", "Test prompt");
        testGameSession.setId(testSessionId);
        testGameSession.setLastActivityAt(Instant.now());

        testGameMessage = new GameMessage(testSessionId, testUserId, "Hello", true, Instant.now());
        testGameMessage.setId("msg123");
    }

    @Test
    void generateGamePreview_WithValidUser_ShouldReturnPreview() {
        // Arrange
        when(userRepository.findById(testUserId)).thenReturn(Optional.of(testUser));
        when(gemini.chat(anyString())).thenReturn("{\"title\":\"Test Game\",\"description\":\"Test Description\"}");

        // Act
        Map<String, String> result = gameService.generateGamePreview(testUserId);

        // Assert
        assertNotNull(result);
        assertEquals("Test Game", result.get("title"));
        assertEquals("Test Description", result.get("description"));
        verify(userRepository).findById(testUserId);
        verify(gemini).chat(anyString());
    }

    @Test
    void generateGamePreview_WithNullUser_ShouldReturnPreview() {
        // Arrange
        when(userRepository.findById(testUserId)).thenReturn(Optional.empty());
        when(gemini.chat(anyString())).thenReturn("{\"title\":\"Test Game\",\"description\":\"Test Description\"}");

        // Act
        Map<String, String> result = gameService.generateGamePreview(testUserId);

        // Assert
        assertNotNull(result);
        assertEquals("Test Game", result.get("title"));
        assertEquals("Test Description", result.get("description"));
        verify(userRepository).findById(testUserId);
        verify(gemini).chat(anyString());
    }

    @Test
    void createGameSession_WithGeneratedGame_ShouldCreateSession() {
        // Arrange
        String gameType = "generated";
        String userDescription = "Test Game: Test Description";
        when(userRepository.findById(testUserId)).thenReturn(Optional.of(testUser));
        when(gemini.chat(anyString())).thenReturn("Test initial message");
        when(gameSessionRepository.save(any(GameSession.class))).thenReturn(testGameSession);
        when(gameMessageRepository.save(any(GameMessage.class))).thenReturn(testGameMessage);

        // Act
        GameSession result = gameService.createGameSession(testUserId, gameType, userDescription);

        // Assert
        assertNotNull(result);
        verify(userRepository).findById(testUserId);
        verify(gemini, times(1)).chat(anyString()); // Called once for initial message only (game title/description extracted from userDescription)
        verify(gameSessionRepository).save(any(GameSession.class));
        verify(gameMessageRepository).save(any(GameMessage.class));
    }

    @Test
    void createGameSession_WithCustomGame_ShouldCreateSession() {
        // Arrange
        String gameType = "custom";
        String userDescription = "Create a puzzle game";
        when(userRepository.findById(testUserId)).thenReturn(Optional.of(testUser));
        when(gemini.chat(anyString())).thenReturn("{\"title\":\"Custom Game\",\"description\":\"Custom Description\"}");
        when(gameSessionRepository.save(any(GameSession.class))).thenReturn(testGameSession);
        when(gameMessageRepository.save(any(GameMessage.class))).thenReturn(testGameMessage);

        // Act
        GameSession result = gameService.createGameSession(testUserId, gameType, userDescription);

        // Assert
        assertNotNull(result);
        verify(userRepository).findById(testUserId);
        verify(gemini, times(2)).chat(anyString()); // Called twice: once for game generation, once for initial message
        verify(gameSessionRepository).save(any(GameSession.class));
        verify(gameMessageRepository).save(any(GameMessage.class));
    }

    @Test
    void createGameSession_WithNullUser_ShouldCreateSession() {
        // Arrange
        String gameType = "generated";
        String userDescription = "Test Game: Test Description";
        when(userRepository.findById(testUserId)).thenReturn(Optional.empty());
        when(gemini.chat(anyString())).thenReturn("Test initial message");
        when(gameSessionRepository.save(any(GameSession.class))).thenReturn(testGameSession);
        when(gameMessageRepository.save(any(GameMessage.class))).thenReturn(testGameMessage);

        // Act
        GameSession result = gameService.createGameSession(testUserId, gameType, userDescription);

        // Assert
        assertNotNull(result);
        verify(userRepository).findById(testUserId);
        verify(gemini, times(1)).chat(anyString()); // Called once for initial message only (game title/description extracted from userDescription)
        verify(gameSessionRepository).save(any(GameSession.class));
        verify(gameMessageRepository).save(any(GameMessage.class));
    }

    @Test
    void processGameMessage_WithValidSession_ShouldReturnResponse() {
        // Arrange
        String message = "Hello";
        when(gameSessionRepository.findById(testSessionId)).thenReturn(Optional.of(testGameSession));
        when(userRepository.findById(testUserId)).thenReturn(Optional.of(testUser));
        when(gameMessageRepository.findTop10ByGameSessionIdOrderByTimestampDesc(testSessionId)).thenReturn(Arrays.asList(testGameMessage));
        when(gemini.chat(anyString())).thenReturn("Test response");
        when(gameMessageRepository.save(any(GameMessage.class))).thenReturn(testGameMessage);
        when(gameSessionRepository.save(any(GameSession.class))).thenReturn(testGameSession);

        // Act
        String result = gameService.processGameMessage(testSessionId, testUserId, message);

        // Assert
        assertNotNull(result);
        assertEquals("Test response", result);
        verify(gameSessionRepository).findById(testSessionId);
        verify(userRepository).findById(testUserId);
        verify(gameMessageRepository).findTop10ByGameSessionIdOrderByTimestampDesc(testSessionId);
        verify(gemini).chat(anyString());
        verify(gameMessageRepository, times(2)).save(any(GameMessage.class));
        verify(gameSessionRepository).save(any(GameSession.class));
    }

    @Test
    void processGameMessage_WithNullSession_ShouldReturnErrorMessage() {
        // Arrange
        String message = "Hello";
        when(gameSessionRepository.findById(testSessionId)).thenReturn(Optional.empty());

        // Act
        String result = gameService.processGameMessage(testSessionId, testUserId, message);

        // Assert
        assertNotNull(result);
        assertEquals("Game session not found.", result);
        verify(gameSessionRepository).findById(testSessionId);
        verify(userRepository, never()).findById(anyString());
    }

    @Test
    void processGameMessage_WithNullUser_ShouldReturnResponse() {
        // Arrange
        String message = "Hello";
        when(gameSessionRepository.findById(testSessionId)).thenReturn(Optional.of(testGameSession));
        when(userRepository.findById(testUserId)).thenReturn(Optional.empty());
        when(gameMessageRepository.findTop10ByGameSessionIdOrderByTimestampDesc(testSessionId)).thenReturn(Arrays.asList(testGameMessage));
        when(gemini.chat(anyString())).thenReturn("Test response");
        when(gameMessageRepository.save(any(GameMessage.class))).thenReturn(testGameMessage);
        when(gameSessionRepository.save(any(GameSession.class))).thenReturn(testGameSession);

        // Act
        String result = gameService.processGameMessage(testSessionId, testUserId, message);

        // Assert
        assertNotNull(result);
        assertEquals("Test response", result);
        verify(gameSessionRepository).findById(testSessionId);
        verify(userRepository).findById(testUserId);
        verify(gemini).chat(anyString());
    }

    @Test
    void getGameMessages_WithValidSession_ShouldReturnMessages() {
        // Arrange
        when(gameMessageRepository.findByGameSessionIdOrderByTimestampAsc(testSessionId)).thenReturn(Arrays.asList(testGameMessage));

        // Act
        List<GameMessage> result = gameService.getGameMessages(testSessionId, 0, 10);

        // Assert
        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals(testGameMessage, result.get(0));
        verify(gameMessageRepository).findByGameSessionIdOrderByTimestampAsc(testSessionId);
    }

    @Test
    void getUserGameSessions_WithValidUser_ShouldReturnSessions() {
        // Arrange
        when(gameSessionRepository.findByUserIdOrderByLastActivityAtDesc(testUserId)).thenReturn(Arrays.asList(testGameSession));

        // Act
        List<GameSession> result = gameService.getUserGameSessions(testUserId);

        // Assert
        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals(testGameSession, result.get(0));
        verify(gameSessionRepository).findByUserIdOrderByLastActivityAtDesc(testUserId);
    }

    @Test
    void getGameSession_WithValidId_ShouldReturnSession() {
        // Arrange
        when(gameSessionRepository.findById(testSessionId)).thenReturn(Optional.of(testGameSession));

        // Act
        GameSession result = gameService.getGameSession(testSessionId);

        // Assert
        assertNotNull(result);
        assertEquals(testGameSession, result);
        verify(gameSessionRepository).findById(testSessionId);
    }

    @Test
    void getGameSession_WithInvalidId_ShouldReturnNull() {
        // Arrange
        when(gameSessionRepository.findById(testSessionId)).thenReturn(Optional.empty());

        // Act
        GameSession result = gameService.getGameSession(testSessionId);

        // Assert
        assertNull(result);
        verify(gameSessionRepository).findById(testSessionId);
    }

    @Test
    void deleteGameSession_WithValidId_ShouldDeleteSessionAndMessages() {
        // Arrange
        when(gameMessageRepository.findByGameSessionIdOrderByTimestampAsc(testSessionId)).thenReturn(Arrays.asList(testGameMessage));

        // Act
        gameService.deleteGameSession(testSessionId);

        // Assert
        verify(gameMessageRepository).findByGameSessionIdOrderByTimestampAsc(testSessionId);
        verify(gameMessageRepository).deleteAll(Arrays.asList(testGameMessage));
        verify(gameSessionRepository).deleteById(testSessionId);
    }

    @Test
    void generateGamePreview_WithInvalidJson_ShouldReturnFallback() {
        // Arrange
        when(userRepository.findById(testUserId)).thenReturn(Optional.of(testUser));
        when(gemini.chat(anyString())).thenReturn("Invalid JSON");

        // Act
        Map<String, String> result = gameService.generateGamePreview(testUserId);

        // Assert
        assertNotNull(result);
        assertEquals("Cognitive Game", result.get("title"));
        assertEquals("Cognitive Game", result.get("description"));
        verify(userRepository).findById(testUserId);
        verify(gemini).chat(anyString());
    }

    @Test
    void createGameSession_WithEmptyUserDescription_ShouldGenerateGame() {
        // Arrange
        String gameType = "generated";
        String userDescription = "";
        when(userRepository.findById(testUserId)).thenReturn(Optional.of(testUser));
        when(gemini.chat(anyString())).thenReturn("{\"title\":\"Generated Game\",\"description\":\"Generated Description\"}");
        when(gameSessionRepository.save(any(GameSession.class))).thenReturn(testGameSession);
        when(gameMessageRepository.save(any(GameMessage.class))).thenReturn(testGameMessage);

        // Act
        GameSession result = gameService.createGameSession(testUserId, gameType, userDescription);

        // Assert
        assertNotNull(result);
        verify(userRepository).findById(testUserId);
        verify(gemini, times(2)).chat(anyString()); // Called twice: once for game generation, once for initial message
        verify(gameSessionRepository).save(any(GameSession.class));
        verify(gameMessageRepository).save(any(GameMessage.class));
    }

    @Test
    void processGameMessage_WithEmptyRecentMessages_ShouldStillProcess() {
        // Arrange
        String message = "Hello";
        when(gameSessionRepository.findById(testSessionId)).thenReturn(Optional.of(testGameSession));
        when(userRepository.findById(testUserId)).thenReturn(Optional.of(testUser));
        when(gameMessageRepository.findTop10ByGameSessionIdOrderByTimestampDesc(testSessionId)).thenReturn(new ArrayList<>());
        when(gemini.chat(anyString())).thenReturn("Test response");
        when(gameMessageRepository.save(any(GameMessage.class))).thenReturn(testGameMessage);
        when(gameSessionRepository.save(any(GameSession.class))).thenReturn(testGameSession);

        // Act
        String result = gameService.processGameMessage(testSessionId, testUserId, message);

        // Assert
        assertNotNull(result);
        assertEquals("Test response", result);
        verify(gameSessionRepository).findById(testSessionId);
        verify(userRepository).findById(testUserId);
        verify(gemini).chat(anyString());
    }
}
