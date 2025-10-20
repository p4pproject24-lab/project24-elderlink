package com.example.ai_companion.controller;

import com.example.ai_companion.model.Reminder;
import com.example.ai_companion.model.ReminderTag;
import com.example.ai_companion.model.ReminderStatus;
import com.example.ai_companion.repository.ReminderRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.time.Instant;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ReminderControllerTest {

    @Mock
    private ReminderRepository reminderRepository;

    @InjectMocks
    private ReminderController reminderController;

    private Reminder testReminder;
    private String testUserId;
    private String testReminderId;

    @BeforeEach
    void setUp() {
        testUserId = "user123";
        testReminderId = "reminder123";
        
        testReminder = new Reminder(
            testUserId,
            "Test Reminder",
            Instant.now(),
            "Test description",
            Arrays.asList(ReminderTag.MEDICATION)
        );
        testReminder.setId(testReminderId);
    }

    @Test
    void createReminder_WithValidReminder_ShouldReturnCreatedReminder() {
        // Arrange
        when(reminderRepository.save(any(Reminder.class))).thenReturn(testReminder);

        // Act
        ResponseEntity<Reminder> response = reminderController.createReminder(testReminder);

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(testReminder, response.getBody());
        verify(reminderRepository).save(testReminder);
    }

    @Test
    void createReminder_WithNullReminder_ShouldStillCallRepository() {
        // Arrange
        when(reminderRepository.save(any())).thenReturn(null);

        // Act
        ResponseEntity<Reminder> response = reminderController.createReminder(null);

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNull(response.getBody());
        verify(reminderRepository).save(null);
    }

    @Test
    void getReminders_WithValidUserId_ShouldReturnPaginatedReminders() {
        // Arrange
        int page = 0;
        List<Reminder> reminders = Arrays.asList(testReminder);
        Page<Reminder> reminderPage = new PageImpl<>(reminders);
        when(reminderRepository.findByUserId(eq(testUserId), any(Pageable.class))).thenReturn(reminderPage);

        // Act
        ResponseEntity<Map<String, Object>> response = reminderController.getReminders(testUserId, page);

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        Map<String, Object> responseBody = response.getBody();
        assertNotNull(responseBody);
        assertEquals(reminders, responseBody.get("reminders"));
        assertEquals(false, responseBody.get("hasMore"));
        assertEquals(page, responseBody.get("currentPage"));
        verify(reminderRepository).findByUserId(eq(testUserId), any(Pageable.class));
    }

    @Test
    void getReminders_WithEmptyUserId_ShouldReturnEmptyList() {
        // Arrange
        String emptyUserId = "";
        int page = 0;
        Page<Reminder> emptyPage = new PageImpl<>(Collections.emptyList());
        when(reminderRepository.findByUserId(eq(emptyUserId), any(Pageable.class))).thenReturn(emptyPage);

        // Act
        ResponseEntity<Map<String, Object>> response = reminderController.getReminders(emptyUserId, page);

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        Map<String, Object> responseBody = response.getBody();
        assertNotNull(responseBody);
        assertEquals(Collections.emptyList(), responseBody.get("reminders"));
        assertEquals(false, responseBody.get("hasMore"));
        verify(reminderRepository).findByUserId(eq(emptyUserId), any(Pageable.class));
    }

    @Test
    void getReminders_WithSecondPage_ShouldReturnCorrectPage() {
        // Arrange
        int page = 1;
        List<Reminder> reminders = Arrays.asList(testReminder);
        Page<Reminder> reminderPage = new PageImpl<>(reminders, PageRequest.of(page, 10), 25);
        when(reminderRepository.findByUserId(eq(testUserId), any(Pageable.class))).thenReturn(reminderPage);

        // Act
        ResponseEntity<Map<String, Object>> response = reminderController.getReminders(testUserId, page);

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        Map<String, Object> responseBody = response.getBody();
        assertNotNull(responseBody);
        assertEquals(page, responseBody.get("currentPage"));
        verify(reminderRepository).findByUserId(eq(testUserId), any(Pageable.class));
    }

    @Test
    void updateReminder_WithExistingReminder_ShouldReturnUpdatedReminder() {
        // Arrange
        Reminder updates = new Reminder(testUserId, "Updated Title", Instant.now(), "Updated description", Arrays.asList(ReminderTag.APPOINTMENT));
        when(reminderRepository.findById(testReminderId)).thenReturn(Optional.of(testReminder));
        when(reminderRepository.save(any(Reminder.class))).thenReturn(testReminder);

        // Act
        ResponseEntity<Reminder> response = reminderController.updateReminder(testReminderId, updates);

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(testReminder, response.getBody());
        verify(reminderRepository).findById(testReminderId);
        verify(reminderRepository).save(any(Reminder.class));
    }

    @Test
    void updateReminder_WithNonExistentReminder_ShouldReturnNotFound() {
        // Arrange
        String nonExistentId = "nonexistent";
        Reminder updates = new Reminder(testUserId, "Updated Title", Instant.now(), "Updated description", Arrays.asList(ReminderTag.APPOINTMENT));
        when(reminderRepository.findById(nonExistentId)).thenReturn(Optional.empty());

        // Act
        ResponseEntity<Reminder> response = reminderController.updateReminder(nonExistentId, updates);

        // Assert
        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
        assertNull(response.getBody());
        verify(reminderRepository).findById(nonExistentId);
        verify(reminderRepository, never()).save(any());
    }

    @Test
    void updateReminder_WithNullUpdates_ShouldThrowException() {
        // Arrange
        when(reminderRepository.findById(testReminderId)).thenReturn(Optional.of(testReminder));

        // Act & Assert
        assertThrows(NullPointerException.class, () -> {
            reminderController.updateReminder(testReminderId, null);
        });
    }

    @Test
    void updateReminder_WithPartialUpdates_ShouldUpdateOnlyProvidedFields() {
        // Arrange
        Reminder updates = new Reminder(testUserId, "Updated Title", null, null, null);
        when(reminderRepository.findById(testReminderId)).thenReturn(Optional.of(testReminder));
        when(reminderRepository.save(any(Reminder.class))).thenReturn(testReminder);

        // Act
        ResponseEntity<Reminder> response = reminderController.updateReminder(testReminderId, updates);

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        verify(reminderRepository).findById(testReminderId);
        verify(reminderRepository).save(any(Reminder.class));
    }

    @Test
    void deleteReminder_WithExistingReminder_ShouldReturnNoContent() {
        // Arrange
        when(reminderRepository.existsById(testReminderId)).thenReturn(true);

        // Act
        ResponseEntity<Void> response = reminderController.deleteReminder(testReminderId);

        // Assert
        assertEquals(HttpStatus.NO_CONTENT, response.getStatusCode());
        assertNull(response.getBody());
        verify(reminderRepository).existsById(testReminderId);
        verify(reminderRepository).deleteById(testReminderId);
    }

    @Test
    void deleteReminder_WithNonExistentReminder_ShouldReturnNotFound() {
        // Arrange
        String nonExistentId = "nonexistent";
        when(reminderRepository.existsById(nonExistentId)).thenReturn(false);

        // Act
        ResponseEntity<Void> response = reminderController.deleteReminder(nonExistentId);

        // Assert
        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
        assertNull(response.getBody());
        verify(reminderRepository).existsById(nonExistentId);
        verify(reminderRepository, never()).deleteById(any());
    }

    @Test
    void deleteReminder_WithNullId_ShouldReturnNotFound() {
        // Arrange
        when(reminderRepository.existsById(null)).thenReturn(false);

        // Act
        ResponseEntity<Void> response = reminderController.deleteReminder(null);

        // Assert
        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
        verify(reminderRepository).existsById(null);
        verify(reminderRepository, never()).deleteById(any());
    }

    @Test
    void createReminder_WithRepositoryException_ShouldPropagateException() {
        // Arrange
        when(reminderRepository.save(any(Reminder.class))).thenThrow(new RuntimeException("Database error"));

        // Act & Assert
        assertThrows(RuntimeException.class, () -> {
            reminderController.createReminder(testReminder);
        });
        verify(reminderRepository).save(testReminder);
    }

    @Test
    void getReminders_WithRepositoryException_ShouldPropagateException() {
        // Arrange
        when(reminderRepository.findByUserId(anyString(), any(Pageable.class))).thenThrow(new RuntimeException("Database error"));

        // Act & Assert
        assertThrows(RuntimeException.class, () -> {
            reminderController.getReminders(testUserId, 0);
        });
    }
}
