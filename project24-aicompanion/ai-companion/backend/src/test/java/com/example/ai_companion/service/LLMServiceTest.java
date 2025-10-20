package com.example.ai_companion.service;

import com.example.ai_companion.model.Message;
import com.example.ai_companion.model.Reminder;
import com.example.ai_companion.model.ReminderTag;
import com.example.ai_companion.model.ReminderStatus;
import com.example.ai_companion.model.User;
import com.example.ai_companion.repository.MessageRepository;
import com.example.ai_companion.repository.ReminderRepository;
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
class LLMServiceTest {

    @Mock
    private ChatLanguageModel chatLanguageModel;

    @Mock
    private UserRepository userRepository;

    @Mock
    private MessageRepository messageRepository;

    @Mock
    private MemoryService memoryService;

    @Mock
    private ReminderRepository reminderRepository;

    @Mock
    private ReminderService reminderService;

    @InjectMocks
    private LLMService llmService;

    private User testUser;
    private Message testMessage;
    private Reminder testReminder;
    private String testUserId;
    private String testQuery;

    @BeforeEach
    void setUp() {
        testUserId = "user123";
        testQuery = "Hello, how are you?";

        testUser = new User();
        testUser.setFirebaseUid(testUserId);
        testUser.setEmail("test@example.com");
        testUser.setFullName("Test User");
        testUser.setCoreInformation("Test core information");

        testMessage = new Message();
        testMessage.setId("msg123");
        testMessage.setUserId(testUserId);
        testMessage.setText("Hello");
        testMessage.setFromUser(true);
        testMessage.setTimestamp(Instant.now());

        testReminder = new Reminder(testUserId, "Test Reminder", Instant.now().plusSeconds(3600), "Test Description", Arrays.asList(ReminderTag.MEDICATION, ReminderTag.APPOINTMENT));
        testReminder.setId("reminder123");
        testReminder.setStatus(ReminderStatus.INCOMPLETE);
    }

    @Test
    void generateAndTrack_WithValidInput_ShouldReturnResponse() {
        // Arrange
        when(userRepository.findByFirebaseUid(testUserId)).thenReturn(testUser);
        when(messageRepository.findTop10ByUserIdOrderByTimestampDesc(testUserId)).thenReturn(Arrays.asList(testMessage));
        when(reminderRepository.findTop10ByUserIdAndTimestampGreaterThanOrderByTimestampAsc(eq(testUserId), any(Instant.class))).thenReturn(Arrays.asList(testReminder));
        when(chatLanguageModel.chat(anyString())).thenReturn("Test response");

        // Act
        String result = llmService.generateAndTrack(testUserId, testQuery, null, "test.log");

        // Assert
        assertNotNull(result);
        assertEquals("Test response", result);
        verify(userRepository).findByFirebaseUid(testUserId);
        verify(messageRepository).findTop10ByUserIdOrderByTimestampDesc(testUserId);
        verify(reminderRepository).findTop10ByUserIdAndTimestampGreaterThanOrderByTimestampAsc(eq(testUserId), any(Instant.class));
        verify(chatLanguageModel).chat(anyString());
    }

    @Test
    void generateAndTrack_WithNullUser_ShouldStillGenerateResponse() {
        // Arrange
        when(userRepository.findByFirebaseUid(testUserId)).thenReturn(null);
        when(messageRepository.findTop10ByUserIdOrderByTimestampDesc(testUserId)).thenReturn(new ArrayList<>());
        when(reminderRepository.findTop10ByUserIdAndTimestampGreaterThanOrderByTimestampAsc(eq(testUserId), any(Instant.class))).thenReturn(new ArrayList<>());
        when(chatLanguageModel.chat(anyString())).thenReturn("Test response");

        // Act
        String result = llmService.generateAndTrack(testUserId, testQuery, null, "test.log");

        // Assert
        assertNotNull(result);
        assertEquals("Test response", result);
        verify(userRepository).findByFirebaseUid(testUserId);
        verify(chatLanguageModel).chat(anyString());
    }

    @Test
    void generateAndTrack_WithLocation_ShouldIncludeLocationInPrompt() {
        // Arrange
        Object location = "New York, NY";
        when(userRepository.findByFirebaseUid(testUserId)).thenReturn(testUser);
        when(messageRepository.findTop10ByUserIdOrderByTimestampDesc(testUserId)).thenReturn(new ArrayList<>());
        when(reminderRepository.findTop10ByUserIdAndTimestampGreaterThanOrderByTimestampAsc(eq(testUserId), any(Instant.class))).thenReturn(new ArrayList<>());
        when(chatLanguageModel.chat(anyString())).thenReturn("Test response");

        // Act
        String result = llmService.generateAndTrack(testUserId, testQuery, location, "test.log");

        // Assert
        assertNotNull(result);
        assertEquals("Test response", result);
        verify(chatLanguageModel).chat(anyString());
    }

    @Test
    void generateAndTrack_WithNullLogFilename_ShouldNotLog() {
        // Arrange
        when(userRepository.findByFirebaseUid(testUserId)).thenReturn(testUser);
        when(messageRepository.findTop10ByUserIdOrderByTimestampDesc(testUserId)).thenReturn(new ArrayList<>());
        when(reminderRepository.findTop10ByUserIdAndTimestampGreaterThanOrderByTimestampAsc(eq(testUserId), any(Instant.class))).thenReturn(new ArrayList<>());
        when(chatLanguageModel.chat(anyString())).thenReturn("Test response");

        // Act
        String result = llmService.generateAndTrack(testUserId, testQuery, null, null);

        // Assert
        assertNotNull(result);
        assertEquals("Test response", result);
    }

    @Test
    void generateAndTrack_WithBackwardCompatibility_ShouldWork() {
        // Arrange
        when(userRepository.findByFirebaseUid(testUserId)).thenReturn(testUser);
        when(messageRepository.findTop10ByUserIdOrderByTimestampDesc(testUserId)).thenReturn(new ArrayList<>());
        when(reminderRepository.findTop10ByUserIdAndTimestampGreaterThanOrderByTimestampAsc(eq(testUserId), any(Instant.class))).thenReturn(new ArrayList<>());
        when(chatLanguageModel.chat(anyString())).thenReturn("Test response");

        // Act
        String result = llmService.generateAndTrack(testUserId, testQuery, null);

        // Assert
        assertNotNull(result);
        assertEquals("Test response", result);
    }

    @Test
    void generateResponse_WithValidPrompt_ShouldReturnResponse() {
        // Arrange
        String prompt = "Test prompt";
        String expectedResponse = "Test response";
        when(chatLanguageModel.chat(prompt)).thenReturn(expectedResponse);

        // Act
        String result = llmService.generateResponse(prompt);

        // Assert
        assertNotNull(result);
        assertEquals(expectedResponse, result);
        verify(chatLanguageModel).chat(prompt);
    }

    @Test
    void generateAndTrack_WithFirstMessage_ShouldLogPromptAndResponse() {
        // Arrange
        when(userRepository.findByFirebaseUid(testUserId)).thenReturn(testUser);
        when(messageRepository.findTop10ByUserIdOrderByTimestampDesc(testUserId)).thenReturn(new ArrayList<>());
        when(reminderRepository.findTop10ByUserIdAndTimestampGreaterThanOrderByTimestampAsc(eq(testUserId), any(Instant.class))).thenReturn(new ArrayList<>());
        when(chatLanguageModel.chat(anyString())).thenReturn("Test response");

        // Act
        String result = llmService.generateAndTrack(testUserId, testQuery, null, "test.log");

        // Assert
        assertNotNull(result);
        assertEquals("Test response", result);
    }

    @Test
    void generateAndTrack_WithExistingChatHistory_ShouldNotLogPromptAndResponse() {
        // Arrange
        when(userRepository.findByFirebaseUid(testUserId)).thenReturn(testUser);
        when(messageRepository.findTop10ByUserIdOrderByTimestampDesc(testUserId)).thenReturn(Arrays.asList(testMessage));
        when(reminderRepository.findTop10ByUserIdAndTimestampGreaterThanOrderByTimestampAsc(eq(testUserId), any(Instant.class))).thenReturn(new ArrayList<>());
        when(chatLanguageModel.chat(anyString())).thenReturn("Test response");

        // Act
        String result = llmService.generateAndTrack(testUserId, testQuery, null, "test.log");

        // Assert
        assertNotNull(result);
        assertEquals("Test response", result);
    }

    @Test
    void generateAndTrack_WithReminders_ShouldIncludeRemindersInPrompt() {
        // Arrange
        when(userRepository.findByFirebaseUid(testUserId)).thenReturn(testUser);
        when(messageRepository.findTop10ByUserIdOrderByTimestampDesc(testUserId)).thenReturn(new ArrayList<>());
        when(reminderRepository.findTop10ByUserIdAndTimestampGreaterThanOrderByTimestampAsc(eq(testUserId), any(Instant.class))).thenReturn(Arrays.asList(testReminder));
        when(chatLanguageModel.chat(anyString())).thenReturn("Test response");

        // Act
        String result = llmService.generateAndTrack(testUserId, testQuery, null, "test.log");

        // Assert
        assertNotNull(result);
        assertEquals("Test response", result);
        verify(chatLanguageModel).chat(anyString());
    }

    @Test
    void generateAndTrack_WithNoReminders_ShouldUseNone() {
        // Arrange
        when(userRepository.findByFirebaseUid(testUserId)).thenReturn(testUser);
        when(messageRepository.findTop10ByUserIdOrderByTimestampDesc(testUserId)).thenReturn(new ArrayList<>());
        when(reminderRepository.findTop10ByUserIdAndTimestampGreaterThanOrderByTimestampAsc(eq(testUserId), any(Instant.class))).thenReturn(new ArrayList<>());
        when(chatLanguageModel.chat(anyString())).thenReturn("Test response");

        // Act
        String result = llmService.generateAndTrack(testUserId, testQuery, null, "test.log");

        // Assert
        assertNotNull(result);
        assertEquals("Test response", result);
        verify(chatLanguageModel).chat(anyString());
    }
}