package com.example.ai_companion.service;

import com.example.ai_companion.model.User;
import com.example.ai_companion.repository.UserRepository;
import dev.langchain4j.model.chat.ChatLanguageModel;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.client.RestTemplate;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class MemoryServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private ChatLanguageModel chatLanguageModel;

    @Mock
    private RestTemplate restTemplate;

    @InjectMocks
    private MemoryService memoryService;

    private User testUser;
    private String testFirebaseUid;
    private String testUserId;
    private String testUserMessage;
    private String testAiResponse;

    @BeforeEach
    void setUp() {
        testFirebaseUid = "test-firebase-uid";
        testUserId = "test-user-id";
        testUserMessage = "I am a software engineer";
        testAiResponse = "That's great! Software engineering is a rewarding field.";

        testUser = new User();
        testUser.setId(testUserId);
        testUser.setFirebaseUid(testFirebaseUid);
        testUser.setCoreInformation("Existing core information");

        // Inject the mocked RestTemplate
        ReflectionTestUtils.setField(memoryService, "restTemplate", restTemplate);
    }

    @Test
    void extractAndStoreInsights_WithValidUser_ShouldExtractAndStoreInsights() {
        // Arrange
        when(userRepository.findByFirebaseUid(testFirebaseUid)).thenReturn(testUser);
        when(chatLanguageModel.chat(anyString())).thenReturn("New core fact about being a software engineer");
        when(restTemplate.postForEntity(anyString(), any(HttpEntity.class), eq(Void.class)))
                .thenReturn(new ResponseEntity<>(HttpStatus.OK));

        // Act
        memoryService.extractAndStoreInsights(testFirebaseUid, testUserMessage, testAiResponse);

        // Assert
        verify(userRepository).findByFirebaseUid(testFirebaseUid);
        verify(chatLanguageModel, atLeast(1)).chat(anyString());
        verify(userRepository).save(testUser);
        verify(restTemplate).postForEntity(eq("http://localhost:8000/remember"), any(HttpEntity.class), eq(Void.class));
    }

    @Test
    void extractAndStoreInsights_WithNullUser_ShouldNotProcess() {
        // Arrange
        when(userRepository.findByFirebaseUid(testFirebaseUid)).thenReturn(null);

        // Act
        memoryService.extractAndStoreInsights(testFirebaseUid, testUserMessage, testAiResponse);

        // Assert
        verify(userRepository).findByFirebaseUid(testFirebaseUid);
        verify(chatLanguageModel, never()).chat(anyString());
        verify(userRepository, never()).save(any(User.class));
        verify(restTemplate, never()).postForEntity(anyString(), any(HttpEntity.class), eq(Void.class));
    }

    @Test
    void extractAndStoreInsights_WithException_ShouldHandleGracefully() {
        // Arrange
        when(userRepository.findByFirebaseUid(testFirebaseUid)).thenReturn(testUser);
        when(chatLanguageModel.chat(anyString())).thenThrow(new RuntimeException("LLM error"));

        // Act & Assert
        // Should not throw exception
        assertDoesNotThrow(() -> {
            memoryService.extractAndStoreInsights(testFirebaseUid, testUserMessage, testAiResponse);
        });

        verify(userRepository).findByFirebaseUid(testFirebaseUid);
        verify(chatLanguageModel).chat(anyString());
    }

    @Test
    void extractAndStoreInsights_WithNoneResponse_ShouldNotUpdateCoreInformation() {
        // Arrange
        when(userRepository.findByFirebaseUid(testFirebaseUid)).thenReturn(testUser);
        when(chatLanguageModel.chat(anyString())).thenReturn("none");

        // Act
        memoryService.extractAndStoreInsights(testFirebaseUid, testUserMessage, testAiResponse);

        // Assert
        verify(userRepository).findByFirebaseUid(testFirebaseUid);
        verify(chatLanguageModel, atLeast(1)).chat(anyString());
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void addManualCoreInformation_WithValidUser_ShouldAddCoreInformation() {
        // Arrange
        String newCoreInfo = "I love hiking and photography";
        when(userRepository.findByFirebaseUid(testFirebaseUid)).thenReturn(testUser);
        when(chatLanguageModel.chat(anyString())).thenReturn("Updated core information with hiking and photography");

        // Act
        memoryService.addManualCoreInformation(testFirebaseUid, newCoreInfo);

        // Assert
        verify(userRepository).findByFirebaseUid(testFirebaseUid);
        verify(chatLanguageModel).chat(anyString());
        verify(userRepository).save(testUser);
        assertEquals("Updated core information with hiking and photography", testUser.getCoreInformation());
    }

    @Test
    void addManualCoreInformation_WithNullUser_ShouldThrowException() {
        // Arrange
        when(userRepository.findByFirebaseUid(testFirebaseUid)).thenReturn(null);

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            memoryService.addManualCoreInformation(testFirebaseUid, "New info");
        });

        assertEquals("User not found: " + testFirebaseUid, exception.getMessage());
        verify(userRepository).findByFirebaseUid(testFirebaseUid);
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void addManualCoreInformation_WithNullExistingCoreInfo_ShouldHandleGracefully() {
        // Arrange
        testUser.setCoreInformation(null);
        when(userRepository.findByFirebaseUid(testFirebaseUid)).thenReturn(testUser);
        when(chatLanguageModel.chat(anyString())).thenReturn("New core information");

        // Act
        memoryService.addManualCoreInformation(testFirebaseUid, "New info");

        // Assert
        verify(userRepository).findByFirebaseUid(testFirebaseUid);
        verify(chatLanguageModel).chat(anyString());
        verify(userRepository).save(testUser);
        assertEquals("New core information", testUser.getCoreInformation());
    }

    @Test
    void addManualContextualMemory_WithValidInput_ShouldStoreMemory() {
        // Arrange
        String contextualMemory = "Planning to visit the museum tomorrow";
        when(restTemplate.postForEntity(anyString(), any(HttpEntity.class), eq(Void.class)))
                .thenReturn(new ResponseEntity<>(HttpStatus.OK));

        // Act
        memoryService.addManualContextualMemory(testFirebaseUid, contextualMemory);

        // Assert
        verify(restTemplate).postForEntity(eq("http://localhost:8000/remember"), any(HttpEntity.class), eq(Void.class));
    }

    @Test
    void addManualContextualMemory_WithException_ShouldThrowException() {
        // Arrange
        String contextualMemory = "Planning to visit the museum tomorrow";
        when(restTemplate.postForEntity(anyString(), any(HttpEntity.class), eq(Void.class)))
                .thenThrow(new RuntimeException("Network error"));

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            memoryService.addManualContextualMemory(testFirebaseUid, contextualMemory);
        });

        assertTrue(exception.getMessage().contains("Failed to store manual contextual memory"));
        verify(restTemplate).postForEntity(eq("http://localhost:8000/remember"), any(HttpEntity.class), eq(Void.class));
    }

    @Test
    void getUserCoreInformation_WithValidUser_ShouldReturnCoreInformation() {
        // Arrange
        when(userRepository.findByFirebaseUid(testFirebaseUid)).thenReturn(testUser);

        // Act
        String result = memoryService.getUserCoreInformation(testFirebaseUid);

        // Assert
        assertEquals("Existing core information", result);
        verify(userRepository).findByFirebaseUid(testFirebaseUid);
    }

    @Test
    void getUserCoreInformation_WithNullUser_ShouldReturnNone() {
        // Arrange
        when(userRepository.findByFirebaseUid(testFirebaseUid)).thenReturn(null);

        // Act
        String result = memoryService.getUserCoreInformation(testFirebaseUid);

        // Assert
        assertEquals("none", result);
        verify(userRepository).findByFirebaseUid(testFirebaseUid);
    }

    @Test
    void getUserCoreInformation_WithNullCoreInformation_ShouldReturnNone() {
        // Arrange
        testUser.setCoreInformation(null);
        when(userRepository.findByFirebaseUid(testFirebaseUid)).thenReturn(testUser);

        // Act
        String result = memoryService.getUserCoreInformation(testFirebaseUid);

        // Assert
        assertEquals("none", result);
        verify(userRepository).findByFirebaseUid(testFirebaseUid);
    }

    @Test
    void extractAndStoreInsights_WithMemoryEmbeddingException_ShouldHandleGracefully() {
        // Arrange
        when(userRepository.findByFirebaseUid(testFirebaseUid)).thenReturn(testUser);
        when(chatLanguageModel.chat(anyString())).thenReturn("New core fact", "Memory to store");
        when(restTemplate.postForEntity(anyString(), any(HttpEntity.class), eq(Void.class)))
                .thenThrow(new RuntimeException("Network error"));

        // Act & Assert
        // Should not throw exception
        assertDoesNotThrow(() -> {
            memoryService.extractAndStoreInsights(testFirebaseUid, testUserMessage, testAiResponse);
        });

        verify(userRepository).findByFirebaseUid(testFirebaseUid);
        verify(chatLanguageModel, atLeast(1)).chat(anyString());
        verify(userRepository).save(testUser);
    }

    @Test
    void extractAndStoreInsights_WithNoneMemoryResponse_ShouldNotStoreMemory() {
        // Arrange
        when(userRepository.findByFirebaseUid(testFirebaseUid)).thenReturn(testUser);
        when(chatLanguageModel.chat(anyString())).thenReturn("New core fact", "none");

        // Act
        memoryService.extractAndStoreInsights(testFirebaseUid, testUserMessage, testAiResponse);

        // Assert
        verify(userRepository).findByFirebaseUid(testFirebaseUid);
        verify(chatLanguageModel, atLeast(1)).chat(anyString());
        verify(userRepository).save(testUser);
        verify(restTemplate, never()).postForEntity(anyString(), any(HttpEntity.class), eq(Void.class));
    }

    @Test
    void addManualCoreInformation_WithEmptyExistingCoreInfo_ShouldHandleGracefully() {
        // Arrange
        testUser.setCoreInformation("");
        when(userRepository.findByFirebaseUid(testFirebaseUid)).thenReturn(testUser);
        when(chatLanguageModel.chat(anyString())).thenReturn("New core information");

        // Act
        memoryService.addManualCoreInformation(testFirebaseUid, "New info");

        // Assert
        verify(userRepository).findByFirebaseUid(testFirebaseUid);
        verify(chatLanguageModel).chat(anyString());
        verify(userRepository).save(testUser);
        assertEquals("New core information", testUser.getCoreInformation());
    }

    @Test
    void addManualContextualMemory_WithEmptyMemory_ShouldStoreMemory() {
        // Arrange
        String contextualMemory = "";
        when(restTemplate.postForEntity(anyString(), any(HttpEntity.class), eq(Void.class)))
                .thenReturn(new ResponseEntity<>(HttpStatus.OK));

        // Act
        memoryService.addManualContextualMemory(testFirebaseUid, contextualMemory);

        // Assert
        verify(restTemplate).postForEntity(eq("http://localhost:8000/remember"), any(HttpEntity.class), eq(Void.class));
    }

    @Test
    void addManualContextualMemory_WithNullMemory_ShouldStoreMemory() {
        // Arrange
        String contextualMemory = null;
        when(restTemplate.postForEntity(anyString(), any(HttpEntity.class), eq(Void.class)))
                .thenReturn(new ResponseEntity<>(HttpStatus.OK));

        // Act
        memoryService.addManualContextualMemory(testFirebaseUid, contextualMemory);

        // Assert
        verify(restTemplate).postForEntity(eq("http://localhost:8000/remember"), any(HttpEntity.class), eq(Void.class));
    }

    @Test
    void extractAndStoreInsights_WithEmptyUserMessage_ShouldProcess() {
        // Arrange
        when(userRepository.findByFirebaseUid(testFirebaseUid)).thenReturn(testUser);
        when(chatLanguageModel.chat(anyString())).thenReturn("none", "none");

        // Act
        memoryService.extractAndStoreInsights(testFirebaseUid, "", testAiResponse);

        // Assert
        verify(userRepository).findByFirebaseUid(testFirebaseUid);
        verify(chatLanguageModel, atLeast(1)).chat(anyString());
    }

    @Test
    void extractAndStoreInsights_WithEmptyAiResponse_ShouldProcess() {
        // Arrange
        when(userRepository.findByFirebaseUid(testFirebaseUid)).thenReturn(testUser);
        when(chatLanguageModel.chat(anyString())).thenReturn("none", "none");

        // Act
        memoryService.extractAndStoreInsights(testFirebaseUid, testUserMessage, "");

        // Assert
        verify(userRepository).findByFirebaseUid(testFirebaseUid);
        verify(chatLanguageModel, atLeast(1)).chat(anyString());
    }

    @Test
    void extractAndStoreInsights_WithNullUserMessage_ShouldProcess() {
        // Arrange
        when(userRepository.findByFirebaseUid(testFirebaseUid)).thenReturn(testUser);
        when(chatLanguageModel.chat(anyString())).thenReturn("none", "none");

        // Act
        memoryService.extractAndStoreInsights(testFirebaseUid, null, testAiResponse);

        // Assert
        verify(userRepository).findByFirebaseUid(testFirebaseUid);
        verify(chatLanguageModel, atLeast(1)).chat(anyString());
    }

    @Test
    void extractAndStoreInsights_WithNullAiResponse_ShouldProcess() {
        // Arrange
        when(userRepository.findByFirebaseUid(testFirebaseUid)).thenReturn(testUser);
        when(chatLanguageModel.chat(anyString())).thenReturn("none", "none");

        // Act
        memoryService.extractAndStoreInsights(testFirebaseUid, testUserMessage, null);

        // Assert
        verify(userRepository).findByFirebaseUid(testFirebaseUid);
        verify(chatLanguageModel, atLeast(1)).chat(anyString());
    }
}
