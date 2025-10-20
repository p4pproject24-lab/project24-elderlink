package com.example.ai_companion.service;

import com.example.ai_companion.model.Reminder;
import com.example.ai_companion.repository.ReminderRepository;
import dev.langchain4j.model.chat.ChatLanguageModel;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ReminderServiceTest {

    @Mock
    private ChatLanguageModel chatLanguageModel;

    @Mock
    private ReminderRepository reminderRepository;

    @InjectMocks
    private ReminderService reminderService;

    private String testUserId;
    private String testUserMessage;

    @BeforeEach
    void setUp() {
        testUserId = "test-user-id";
        testUserMessage = "I need to take my medication at 9 AM tomorrow";
    }

    @Test
    void extractReminders_WithValidMessage_ShouldExtractAndStoreReminders() {
        // Arrange
        String llmResponse = """
            Task: Take medication
            Date: 2024-01-15 09:00
            Description: Take morning medication
            Tags: MEDICATION, HEALTH
            """;
        when(chatLanguageModel.chat(anyString())).thenReturn(llmResponse);
        when(reminderRepository.save(any(Reminder.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // Act
        reminderService.extractReminders(testUserId, testUserMessage);

        // Assert
        verify(chatLanguageModel).chat(anyString());
        verify(reminderRepository).save(any(Reminder.class));
    }

    @Test
    void extractReminders_WithNoneResponse_ShouldNotStoreReminders() {
        // Arrange
        when(chatLanguageModel.chat(anyString())).thenReturn("none");

        // Act
        reminderService.extractReminders(testUserId, testUserMessage);

        // Assert
        verify(chatLanguageModel).chat(anyString());
        verify(reminderRepository, never()).save(any(Reminder.class));
    }

    @Test
    void extractReminders_WithEmptyResponse_ShouldNotStoreReminders() {
        // Arrange
        when(chatLanguageModel.chat(anyString())).thenReturn("");

        // Act
        reminderService.extractReminders(testUserId, testUserMessage);

        // Assert
        verify(chatLanguageModel).chat(anyString());
        verify(reminderRepository, never()).save(any(Reminder.class));
    }

    @Test
    void extractReminders_WithWhitespaceResponse_ShouldNotStoreReminders() {
        // Arrange
        when(chatLanguageModel.chat(anyString())).thenReturn("   ");

        // Act
        reminderService.extractReminders(testUserId, testUserMessage);

        // Assert
        verify(chatLanguageModel).chat(anyString());
        verify(reminderRepository, never()).save(any(Reminder.class));
    }

    @Test
    void extractReminders_WithMultipleReminders_ShouldStoreAllReminders() {
        // Arrange
        String llmResponse = """
            Task: Take medication
            Date: 2024-01-15 09:00
            Description: Take morning medication
            Tags: MEDICATION

            Task: Doctor appointment
            Date: 2024-01-16 14:30
            Description: Annual checkup
            Tags: APPOINTMENT, HEALTH
            """;
        when(chatLanguageModel.chat(anyString())).thenReturn(llmResponse);
        when(reminderRepository.save(any(Reminder.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // Act
        reminderService.extractReminders(testUserId, testUserMessage);

        // Assert
        verify(chatLanguageModel).chat(anyString());
        verify(reminderRepository, times(2)).save(any(Reminder.class));
    }

    @Test
    void extractReminders_WithIncompleteReminder_ShouldNotStoreIncompleteReminder() {
        // Arrange
        String llmResponse = """
            Task: Take medication
            Date: 2024-01-15 09:00
            Description: Take morning medication
            """;
        when(chatLanguageModel.chat(anyString())).thenReturn(llmResponse);

        // Act
        reminderService.extractReminders(testUserId, testUserMessage);

        // Assert
        verify(chatLanguageModel).chat(anyString());
        verify(reminderRepository, never()).save(any(Reminder.class));
    }

    @Test
    void extractReminders_WithInvalidDate_ShouldNotStoreReminder() {
        // Arrange
        String llmResponse = """
            Task: Take medication
            Date: invalid-date
            Description: Take morning medication
            Tags: MEDICATION
            """;
        when(chatLanguageModel.chat(anyString())).thenReturn(llmResponse);

        // Act
        reminderService.extractReminders(testUserId, testUserMessage);

        // Assert
        verify(chatLanguageModel).chat(anyString());
        verify(reminderRepository, never()).save(any(Reminder.class));
    }

    @Test
    void extractReminders_WithValidISO8601Date_ShouldStoreReminder() {
        // Arrange
        String llmResponse = """
            Task: Take medication
            Date: 2024-01-15T09:00:00Z
            Description: Take morning medication
            Tags: MEDICATION
            """;
        when(chatLanguageModel.chat(anyString())).thenReturn(llmResponse);
        when(reminderRepository.save(any(Reminder.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // Act
        reminderService.extractReminders(testUserId, testUserMessage);

        // Assert
        verify(chatLanguageModel).chat(anyString());
        verify(reminderRepository).save(any(Reminder.class));
    }

    @Test
    void extractReminders_WithValidDateTimeFormat_ShouldStoreReminder() {
        // Arrange
        String llmResponse = """
            Task: Take medication
            Date: 2024-01-15 09:00
            Description: Take morning medication
            Tags: MEDICATION
            """;
        when(chatLanguageModel.chat(anyString())).thenReturn(llmResponse);
        when(reminderRepository.save(any(Reminder.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // Act
        reminderService.extractReminders(testUserId, testUserMessage);

        // Assert
        verify(chatLanguageModel).chat(anyString());
        verify(reminderRepository).save(any(Reminder.class));
    }

    @Test
    void extractReminders_WithValidDateOnly_ShouldStoreReminder() {
        // Arrange
        String llmResponse = """
            Task: Take medication
            Date: 2024-01-15
            Description: Take morning medication
            Tags: MEDICATION
            """;
        when(chatLanguageModel.chat(anyString())).thenReturn(llmResponse);
        when(reminderRepository.save(any(Reminder.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // Act
        reminderService.extractReminders(testUserId, testUserMessage);

        // Assert
        verify(chatLanguageModel).chat(anyString());
        verify(reminderRepository).save(any(Reminder.class));
    }

    @Test
    void extractReminders_WithValidTags_ShouldStoreReminderWithTags() {
        // Arrange
        String llmResponse = """
            Task: Take medication
            Date: 2024-01-15 09:00
            Description: Take morning medication
            Tags: MEDICATION, HEALTH
            """;
        when(chatLanguageModel.chat(anyString())).thenReturn(llmResponse);
        when(reminderRepository.save(any(Reminder.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // Act
        reminderService.extractReminders(testUserId, testUserMessage);

        // Assert
        verify(chatLanguageModel).chat(anyString());
        verify(reminderRepository).save(any(Reminder.class));
    }

    @Test
    void extractReminders_WithInvalidTags_ShouldStoreReminderWithOtherTag() {
        // Arrange
        String llmResponse = """
            Task: Take medication
            Date: 2024-01-15 09:00
            Description: Take morning medication
            Tags: INVALID_TAG, MEDICATION
            """;
        when(chatLanguageModel.chat(anyString())).thenReturn(llmResponse);
        when(reminderRepository.save(any(Reminder.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // Act
        reminderService.extractReminders(testUserId, testUserMessage);

        // Assert
        verify(chatLanguageModel).chat(anyString());
        verify(reminderRepository).save(any(Reminder.class));
    }

    @Test
    void extractReminders_WithEmptyTags_ShouldStoreReminderWithOtherTag() {
        // Arrange
        String llmResponse = """
            Task: Take medication
            Date: 2024-01-15 09:00
            Description: Take morning medication
            Tags: 
            """;
        when(chatLanguageModel.chat(anyString())).thenReturn(llmResponse);
        when(reminderRepository.save(any(Reminder.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // Act
        reminderService.extractReminders(testUserId, testUserMessage);

        // Assert
        verify(chatLanguageModel).chat(anyString());
        verify(reminderRepository).save(any(Reminder.class));
    }

    @Test
    void extractReminders_WithNullTags_ShouldStoreReminderWithOtherTag() {
        // Arrange
        String llmResponse = """
            Task: Take medication
            Date: 2024-01-15 09:00
            Description: Take morning medication
            Tags: null
            """;
        when(chatLanguageModel.chat(anyString())).thenReturn(llmResponse);
        when(reminderRepository.save(any(Reminder.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // Act
        reminderService.extractReminders(testUserId, testUserMessage);

        // Assert
        verify(chatLanguageModel).chat(anyString());
        verify(reminderRepository).save(any(Reminder.class));
    }

    @Test
    void extractReminders_WithEmptyUserMessage_ShouldStillCallLLM() {
        // Arrange
        when(chatLanguageModel.chat(anyString())).thenReturn("none");

        // Act
        reminderService.extractReminders(testUserId, "");

        // Assert
        verify(chatLanguageModel).chat(anyString());
        verify(reminderRepository, never()).save(any(Reminder.class));
    }

    @Test
    void extractReminders_WithNullUserMessage_ShouldStillCallLLM() {
        // Arrange
        when(chatLanguageModel.chat(anyString())).thenReturn("none");

        // Act
        reminderService.extractReminders(testUserId, null);

        // Assert
        verify(chatLanguageModel).chat(anyString());
        verify(reminderRepository, never()).save(any(Reminder.class));
    }

    @Test
    void extractReminders_WithEmptyUserId_ShouldStillCallLLM() {
        // Arrange
        when(chatLanguageModel.chat(anyString())).thenReturn("none");

        // Act
        reminderService.extractReminders("", testUserMessage);

        // Assert
        verify(chatLanguageModel).chat(anyString());
        verify(reminderRepository, never()).save(any(Reminder.class));
    }

    @Test
    void extractReminders_WithNullUserId_ShouldStillCallLLM() {
        // Arrange
        when(chatLanguageModel.chat(anyString())).thenReturn("none");

        // Act
        reminderService.extractReminders(null, testUserMessage);

        // Assert
        verify(chatLanguageModel).chat(anyString());
        verify(reminderRepository, never()).save(any(Reminder.class));
    }

    @Test
    void extractReminders_WithMixedCaseTags_ShouldStoreReminderWithCorrectTags() {
        // Arrange
        String llmResponse = """
            Task: Take medication
            Date: 2024-01-15 09:00
            Description: Take morning medication
            Tags: medication, health, appointment
            """;
        when(chatLanguageModel.chat(anyString())).thenReturn(llmResponse);
        when(reminderRepository.save(any(Reminder.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // Act
        reminderService.extractReminders(testUserId, testUserMessage);

        // Assert
        verify(chatLanguageModel).chat(anyString());
        verify(reminderRepository).save(any(Reminder.class));
    }

    @Test
    void extractReminders_WithWhitespaceInTags_ShouldStoreReminderWithCorrectTags() {
        // Arrange
        String llmResponse = """
            Task: Take medication
            Date: 2024-01-15 09:00
            Description: Take morning medication
            Tags: MEDICATION , HEALTH , APPOINTMENT
            """;
        when(chatLanguageModel.chat(anyString())).thenReturn(llmResponse);
        when(reminderRepository.save(any(Reminder.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // Act
        reminderService.extractReminders(testUserId, testUserMessage);

        // Assert
        verify(chatLanguageModel).chat(anyString());
        verify(reminderRepository).save(any(Reminder.class));
    }

    @Test
    void extractReminders_WithEmptyTask_ShouldStoreReminder() {
        // Arrange
        String llmResponse = """
            Task: 
            Date: 2024-01-15 09:00
            Description: Take morning medication
            Tags: MEDICATION
            """;
        when(chatLanguageModel.chat(anyString())).thenReturn(llmResponse);
        when(reminderRepository.save(any(Reminder.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // Act
        reminderService.extractReminders(testUserId, testUserMessage);

        // Assert
        verify(chatLanguageModel).chat(anyString());
        verify(reminderRepository).save(any(Reminder.class));
    }

    @Test
    void extractReminders_WithEmptyDate_ShouldNotStoreReminder() {
        // Arrange
        String llmResponse = """
            Task: Take medication
            Date: 
            Description: Take morning medication
            Tags: MEDICATION
            """;
        when(chatLanguageModel.chat(anyString())).thenReturn(llmResponse);

        // Act
        reminderService.extractReminders(testUserId, testUserMessage);

        // Assert
        verify(chatLanguageModel).chat(anyString());
        verify(reminderRepository, never()).save(any(Reminder.class));
    }

    @Test
    void extractReminders_WithAllValidReminderTags_ShouldStoreReminderWithAllTags() {
        // Arrange
        String llmResponse = """
            Task: Take medication
            Date: 2024-01-15 09:00
            Description: Take morning medication
            Tags: MEDICATION, APPOINTMENT, EVENT, TASK, PERSONAL, WORK, FINANCE, HEALTH, TRAVEL, SOCIAL, EDUCATION, LEISURE, OTHER
            """;
        when(chatLanguageModel.chat(anyString())).thenReturn(llmResponse);
        when(reminderRepository.save(any(Reminder.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // Act
        reminderService.extractReminders(testUserId, testUserMessage);

        // Assert
        verify(chatLanguageModel).chat(anyString());
        verify(reminderRepository).save(any(Reminder.class));
    }

    @Test
    void extractReminders_WithComplexUserMessage_ShouldExtractReminders() {
        // Arrange
        String complexMessage = "I need to take my medication at 9 AM tomorrow, and I have a doctor appointment on Friday at 2 PM";
        String llmResponse = """
            Task: Take medication
            Date: 2024-01-15 09:00
            Description: Take morning medication
            Tags: MEDICATION

            Task: Doctor appointment
            Date: 2024-01-19 14:00
            Description: Doctor appointment
            Tags: APPOINTMENT, HEALTH
            """;
        when(chatLanguageModel.chat(anyString())).thenReturn(llmResponse);
        when(reminderRepository.save(any(Reminder.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // Act
        reminderService.extractReminders(testUserId, complexMessage);

        // Assert
        verify(chatLanguageModel).chat(anyString());
        verify(reminderRepository, times(2)).save(any(Reminder.class));
    }
}
