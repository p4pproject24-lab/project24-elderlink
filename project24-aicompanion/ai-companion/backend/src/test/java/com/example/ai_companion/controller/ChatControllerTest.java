package com.example.ai_companion.controller;

import com.example.ai_companion.model.Message;
import com.example.ai_companion.model.User;
import com.example.ai_companion.repository.MessageRepository;
import com.example.ai_companion.repository.UserRepository;
import com.example.ai_companion.response.ApiResponse;
import com.example.ai_companion.service.GameService;
import com.example.ai_companion.service.HeyGenService;
import com.example.ai_companion.service.LLMService;
import com.example.ai_companion.service.MemoryService;
import com.example.ai_companion.service.ReminderService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.time.Instant;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ChatControllerTest {

    @Mock
    private MemoryService memoryService;

    @Mock
    private LLMService llmService;

    @Mock
    private MessageRepository messageRepository;

    @Mock
    private HeyGenService heyGenService;

    @Mock
    private UserRepository userRepository;

    @Mock
    private ReminderService reminderService;

    @Mock
    private GameService gameService;

    @InjectMocks
    private ChatController chatController;

    private String testUserId;
    private User testUser;
    private Message testMessage;

    @BeforeEach
    void setUp() {
        testUserId = "user123";
        
        testUser = new User();
        testUser.setId("user123");
        testUser.setFirebaseUid("firebase123");
        testUser.setFullName("John Doe");
        testUser.setCoreInformation("Test core info");

        testMessage = new Message();
        testMessage.setId("msg123");
        testMessage.setUserId(testUserId);
        testMessage.setText("Hello");
        testMessage.setFromUser(true);
        testMessage.setTimestamp(Instant.now());
    }

    @Test
    void ask_WithValidInput_ShouldReturnAiResponse() {
        // Arrange
        Map<String, Object> payload = new HashMap<>();
        payload.put("message", "Hello");
        payload.put("location", "New York");

        when(llmService.generateAndTrack(eq(testUserId), eq("Hello"), eq("New York")))
                .thenReturn("AI Response");

        // Act
        String result = chatController.ask(testUserId, payload);

        // Assert
        assertEquals("AI Response", result);
        verify(llmService).generateAndTrack(eq(testUserId), eq("Hello"), eq("New York"));
        verify(reminderService, timeout(1000)).extractReminders(eq(testUserId), eq("Hello"));
    }

    @Test
    void ask_WithNullLocation_ShouldReturnAiResponse() {
        // Arrange
        Map<String, Object> payload = new HashMap<>();
        payload.put("message", "Hello");
        payload.put("location", null);

        when(llmService.generateAndTrack(eq(testUserId), eq("Hello"), isNull()))
                .thenReturn("AI Response");

        // Act
        String result = chatController.ask(testUserId, payload);

        // Assert
        assertEquals("AI Response", result);
        verify(llmService).generateAndTrack(eq(testUserId), eq("Hello"), isNull());
    }

    @Test
    void ask_WithoutLocation_ShouldReturnAiResponse() {
        // Arrange
        Map<String, Object> payload = new HashMap<>();
        payload.put("message", "Hello");

        when(llmService.generateAndTrack(eq(testUserId), eq("Hello"), isNull()))
                .thenReturn("AI Response");

        // Act
        String result = chatController.ask(testUserId, payload);

        // Assert
        assertEquals("AI Response", result);
        verify(llmService).generateAndTrack(eq(testUserId), eq("Hello"), isNull());
    }

    @Test
    void askAvatar_WithValidInput_ShouldReturnAvatarResponse() {
        // Arrange
        Map<String, Object> payload = new HashMap<>();
        payload.put("message", "Hello");
        payload.put("sessionId", "session123");

        Map<String, Object> taskResult = new HashMap<>();
        taskResult.put("duration_ms", 1500);
        taskResult.put("task_id", "task123");

        when(llmService.generateAndTrack(eq(testUserId), eq("Hello"), isNull(), anyString()))
                .thenReturn("AI Response");
        when(heyGenService.sendTaskToHeyGen(eq("session123"), eq("AI Response"), eq("repeat"), anyString()))
                .thenReturn(taskResult);

        // Act
        ResponseEntity<?> response = chatController.askAvatar(testUserId, payload);

        // Assert
        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertTrue(response.getBody() instanceof ApiResponse);
        
        ApiResponse apiResponse = (ApiResponse) response.getBody();
        assertEquals("AI and avatar response", apiResponse.getMessage());
        assertNotNull(apiResponse.getData());
        
        @SuppressWarnings("unchecked")
        Map<String, Object> data = (Map<String, Object>) apiResponse.getData();
        assertEquals("AI Response", data.get("text"));
        assertEquals(1500, data.get("duration_ms"));
        assertEquals("task123", data.get("task_id"));
    }

    @Test
    void askAutoAvatar_WithFirstTimeUser_ShouldGenerateWelcomeMessage() {
        // Arrange
        Map<String, Object> payload = new HashMap<>();
        payload.put("sessionId", "session123");
        payload.put("location", "New York");

        when(messageRepository.findTop10ByUserIdOrderByTimestampDesc(testUserId))
                .thenReturn(new ArrayList<>());
        when(userRepository.findByFirebaseUid(testUserId)).thenReturn(testUser);
        when(llmService.generateResponse(anyString())).thenReturn("Welcome message");
        
        Map<String, Object> taskResult = new HashMap<>();
        taskResult.put("duration_ms", 2000);
        taskResult.put("task_id", "task456");
        when(heyGenService.sendTaskToHeyGen(eq("session123"), eq("Welcome message"), eq("repeat"), anyString()))
                .thenReturn(taskResult);

        // Act
        ResponseEntity<?> response = chatController.askAutoAvatar(testUserId, payload);

        // Assert
        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertTrue(response.getBody() instanceof ApiResponse);
        
        ApiResponse apiResponse = (ApiResponse) response.getBody();
        assertEquals("AI auto and avatar response", apiResponse.getMessage());
        verify(messageRepository).save(any(Message.class));
    }

    @Test
    void askAutoAvatar_WithReturningUser_ShouldGenerateResumeMessage() {
        // Arrange
        Map<String, Object> payload = new HashMap<>();
        payload.put("sessionId", "session123");
        payload.put("location", "New York");

        List<Message> recentMessages = Arrays.asList(testMessage);
        when(messageRepository.findTop10ByUserIdOrderByTimestampDesc(testUserId))
                .thenReturn(recentMessages);
        when(llmService.generateResponse(anyString())).thenReturn("Resume message");
        
        Map<String, Object> taskResult = new HashMap<>();
        taskResult.put("duration_ms", 1800);
        taskResult.put("task_id", "task789");
        when(heyGenService.sendTaskToHeyGen(eq("session123"), eq("Resume message"), eq("repeat"), anyString()))
                .thenReturn(taskResult);

        // Act
        ResponseEntity<?> response = chatController.askAutoAvatar(testUserId, payload);

        // Assert
        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        verify(messageRepository).save(any(Message.class));
    }

    @Test
    void askGameAvatar_WithValidInput_ShouldReturnGameResponse() {
        // Arrange
        Map<String, Object> payload = new HashMap<>();
        payload.put("message", "Game message");
        payload.put("gameSessionId", "game123");
        payload.put("sessionId", "session123");

        when(gameService.processGameMessage(eq("game123"), eq(testUserId), eq("Game message")))
                .thenReturn("Game AI Response");
        
        Map<String, Object> taskResult = new HashMap<>();
        taskResult.put("duration_ms", 1200);
        taskResult.put("task_id", "task999");
        when(heyGenService.sendTaskToHeyGen(eq("session123"), eq("Game AI Response"), eq("repeat"), anyString()))
                .thenReturn(taskResult);

        // Act
        ResponseEntity<?> response = chatController.askGameAvatar(testUserId, payload);

        // Assert
        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertTrue(response.getBody() instanceof ApiResponse);
        
        ApiResponse apiResponse = (ApiResponse) response.getBody();
        assertEquals("AI game and avatar response", apiResponse.getMessage());
        
        @SuppressWarnings("unchecked")
        Map<String, Object> data = (Map<String, Object>) apiResponse.getData();
        assertEquals("Game AI Response", data.get("text"));
    }

    @Test
    void introduce_WithValidUser_ShouldGenerateWelcomeMessage() {
        // Arrange
        String introText = "I am John, I like reading books";
        when(userRepository.findByFirebaseUid(testUserId)).thenReturn(testUser);
        when(llmService.generateResponse(anyString())).thenReturn("Welcome John! I'm here to help you.");

        // Act
        ResponseEntity<String> response = chatController.introduce(testUserId, introText);

        // Assert
        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals("AI welcome message generated and stored.", response.getBody());
        verify(messageRepository).save(any(Message.class));
        verify(memoryService).extractAndStoreInsights(eq(testUser.getFirebaseUid()), eq(introText), anyString());
    }

    @Test
    void introduce_WithUserNotFound_ShouldReturnNotFound() {
        // Arrange
        String introText = "I am John, I like reading books";
        when(userRepository.findByFirebaseUid(testUserId)).thenReturn(null);

        // Act
        ResponseEntity<String> response = chatController.introduce(testUserId, introText);

        // Assert
        assertNotNull(response);
        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
        assertEquals("User not found. Introduction not saved.", response.getBody());
        verify(messageRepository, never()).save(any(Message.class));
    }

    @Test
    void introduce_WithException_ShouldReturnInternalServerError() {
        // Arrange
        String introText = "I am John, I like reading books";
        when(userRepository.findByFirebaseUid(testUserId)).thenThrow(new RuntimeException("Database error"));

        // Act
        ResponseEntity<String> response = chatController.introduce(testUserId, introText);

        // Assert
        assertNotNull(response);
        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, response.getStatusCode());
        assertTrue(response.getBody().contains("Internal error during introduction"));
    }

    @Test
    void getChats_WithValidInput_ShouldReturnMessages() {
        // Arrange
        int page = 0;
        List<Message> messages = Arrays.asList(testMessage);
        PageRequest pageRequest = PageRequest.of(page, 30, Sort.by(Sort.Direction.DESC, "timestamp"));
        
        when(messageRepository.findByUserId(testUserId, pageRequest)).thenReturn(messages);

        // Act
        ResponseEntity<List<Message>> response = chatController.getChats(testUserId, page);

        // Assert
        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(1, response.getBody().size());
        assertEquals(testMessage, response.getBody().get(0));
    }

    @Test
    void getChats_WithDefaultPage_ShouldReturnMessages() {
        // Arrange
        List<Message> messages = Arrays.asList(testMessage);
        PageRequest pageRequest = PageRequest.of(0, 30, Sort.by(Sort.Direction.DESC, "timestamp"));
        
        when(messageRepository.findByUserId(testUserId, pageRequest)).thenReturn(messages);

        // Act
        ResponseEntity<List<Message>> response = chatController.getChats(testUserId, 0);

        // Assert
        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(1, response.getBody().size());
    }

    @Test
    void getChats_WithEmptyMessages_ShouldReturnEmptyList() {
        // Arrange
        int page = 0;
        List<Message> messages = new ArrayList<>();
        PageRequest pageRequest = PageRequest.of(page, 30, Sort.by(Sort.Direction.DESC, "timestamp"));
        
        when(messageRepository.findByUserId(testUserId, pageRequest)).thenReturn(messages);

        // Act
        ResponseEntity<List<Message>> response = chatController.getChats(testUserId, page);

        // Assert
        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertTrue(response.getBody().isEmpty());
    }

    @Test
    void deleteMessage_WithExistingMessage_ShouldDeleteMessage() {
        // Arrange
        String messageId = "msg123";
        when(messageRepository.existsById(messageId)).thenReturn(true);

        // Act
        ResponseEntity<Void> response = chatController.deleteMessage(messageId);

        // Assert
        assertNotNull(response);
        assertEquals(HttpStatus.NO_CONTENT, response.getStatusCode());
        verify(messageRepository).deleteById(messageId);
    }

    @Test
    void deleteMessage_WithNonExistentMessage_ShouldReturnNotFound() {
        // Arrange
        String messageId = "nonexistent";
        when(messageRepository.existsById(messageId)).thenReturn(false);

        // Act
        ResponseEntity<Void> response = chatController.deleteMessage(messageId);

        // Assert
        assertNotNull(response);
        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
        verify(messageRepository, never()).deleteById(anyString());
    }

    @Test
    void ask_WithNullMessage_ShouldHandleGracefully() {
        // Arrange
        Map<String, Object> payload = new HashMap<>();
        payload.put("message", null);

        when(llmService.generateAndTrack(eq(testUserId), isNull(), isNull()))
                .thenReturn("AI Response");

        // Act
        String result = chatController.ask(testUserId, payload);

        // Assert
        assertEquals("AI Response", result);
        verify(llmService).generateAndTrack(eq(testUserId), isNull(), isNull());
    }

    @Test
    void askAvatar_WithNullMessage_ShouldHandleGracefully() {
        // Arrange
        Map<String, Object> payload = new HashMap<>();
        payload.put("message", null);
        payload.put("sessionId", "session123");

        Map<String, Object> taskResult = new HashMap<>();
        taskResult.put("duration_ms", 1000);
        taskResult.put("task_id", "task123");

        when(llmService.generateAndTrack(eq(testUserId), isNull(), isNull(), anyString()))
                .thenReturn("AI Response");
        when(heyGenService.sendTaskToHeyGen(eq("session123"), eq("AI Response"), eq("repeat"), anyString()))
                .thenReturn(taskResult);

        // Act
        ResponseEntity<?> response = chatController.askAvatar(testUserId, payload);

        // Assert
        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
    }

    @Test
    void askAutoAvatar_WithNullUser_ShouldHandleGracefully() {
        // Arrange
        Map<String, Object> payload = new HashMap<>();
        payload.put("sessionId", "session123");

        when(messageRepository.findTop10ByUserIdOrderByTimestampDesc(testUserId))
                .thenReturn(new ArrayList<>());
        when(userRepository.findByFirebaseUid(testUserId)).thenReturn(null);
        when(llmService.generateResponse(anyString())).thenReturn("Welcome message");
        
        Map<String, Object> taskResult = new HashMap<>();
        taskResult.put("duration_ms", 2000);
        taskResult.put("task_id", "task456");
        when(heyGenService.sendTaskToHeyGen(eq("session123"), anyString(), eq("repeat"), anyString()))
                .thenReturn(taskResult);

        // Act
        ResponseEntity<?> response = chatController.askAutoAvatar(testUserId, payload);

        // Assert
        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        verify(messageRepository).save(any(Message.class));
    }

    @Test
    void askAutoAvatar_WithUserHavingNullFields_ShouldHandleGracefully() {
        // Arrange
        Map<String, Object> payload = new HashMap<>();
        payload.put("sessionId", "session123");

        testUser.setFullName(null);
        testUser.setCoreInformation(null);

        when(messageRepository.findTop10ByUserIdOrderByTimestampDesc(testUserId))
                .thenReturn(new ArrayList<>());
        when(userRepository.findByFirebaseUid(testUserId)).thenReturn(testUser);
        when(llmService.generateResponse(anyString())).thenReturn("Welcome message");
        
        Map<String, Object> taskResult = new HashMap<>();
        taskResult.put("duration_ms", 2000);
        taskResult.put("task_id", "task456");
        when(heyGenService.sendTaskToHeyGen(eq("session123"), anyString(), eq("repeat"), anyString()))
                .thenReturn(taskResult);

        // Act
        ResponseEntity<?> response = chatController.askAutoAvatar(testUserId, payload);

        // Assert
        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        verify(messageRepository).save(any(Message.class));
    }
}
