package com.example.ai_companion.controller;

import com.example.ai_companion.model.DailySummary;
import com.example.ai_companion.service.DailySummaryService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DailySummaryControllerTest {

    @Mock
    private DailySummaryService dailySummaryService;

    @InjectMocks
    private DailySummaryController dailySummaryController;

    private String testUserId;
    private LocalDate testDate;
    private DailySummary testSummary;

    @BeforeEach
    void setUp() {
        testUserId = "user123";
        testDate = LocalDate.of(2024, 1, 15);
        
        testSummary = new DailySummary();
        testSummary.setId("summary123");
        testSummary.setUserId(testUserId);
        testSummary.setDate(testDate);
        testSummary.setSummary("Test daily summary");
    }

    @Test
    void getUserDailySummaries_WithValidUserId_ShouldReturnSummaries() {
        // Arrange
        List<DailySummary> expectedSummaries = Arrays.asList(testSummary);
        when(dailySummaryService.getUserDailySummaries(testUserId)).thenReturn(expectedSummaries);

        // Act
        ResponseEntity<List<DailySummary>> response = dailySummaryController.getUserDailySummaries(testUserId);

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(expectedSummaries, response.getBody());
        verify(dailySummaryService).getUserDailySummaries(testUserId);
    }

    @Test
    void getUserDailySummaries_WithServiceException_ShouldReturnInternalServerError() {
        // Arrange
        when(dailySummaryService.getUserDailySummaries(testUserId)).thenThrow(new RuntimeException("Service error"));

        // Act
        ResponseEntity<List<DailySummary>> response = dailySummaryController.getUserDailySummaries(testUserId);

        // Assert
        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, response.getStatusCode());
        assertNull(response.getBody());
        verify(dailySummaryService).getUserDailySummaries(testUserId);
    }

    @Test
    void getUserDailySummaries_WithEmptyUserId_ShouldCallService() {
        // Arrange
        String emptyUserId = "";
        List<DailySummary> emptySummaries = Collections.emptyList();
        when(dailySummaryService.getUserDailySummaries(emptyUserId)).thenReturn(emptySummaries);

        // Act
        ResponseEntity<List<DailySummary>> response = dailySummaryController.getUserDailySummaries(emptyUserId);

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(emptySummaries, response.getBody());
        verify(dailySummaryService).getUserDailySummaries(emptyUserId);
    }

    @Test
    void getDailySummary_WithValidInput_ShouldReturnSummary() {
        // Arrange
        when(dailySummaryService.getDailySummary(testUserId, testDate)).thenReturn(testSummary);

        // Act
        ResponseEntity<DailySummary> response = dailySummaryController.getDailySummary(testUserId, testDate);

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(testSummary, response.getBody());
        verify(dailySummaryService).getDailySummary(testUserId, testDate);
    }

    @Test
    void getDailySummary_WithNonExistentSummary_ShouldReturnNotFound() {
        // Arrange
        when(dailySummaryService.getDailySummary(testUserId, testDate)).thenReturn(null);

        // Act
        ResponseEntity<DailySummary> response = dailySummaryController.getDailySummary(testUserId, testDate);

        // Assert
        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
        assertNull(response.getBody());
        verify(dailySummaryService).getDailySummary(testUserId, testDate);
    }

    @Test
    void getDailySummary_WithServiceException_ShouldReturnInternalServerError() {
        // Arrange
        when(dailySummaryService.getDailySummary(testUserId, testDate)).thenThrow(new RuntimeException("Service error"));

        // Act
        ResponseEntity<DailySummary> response = dailySummaryController.getDailySummary(testUserId, testDate);

        // Assert
        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, response.getStatusCode());
        assertNull(response.getBody());
        verify(dailySummaryService).getDailySummary(testUserId, testDate);
    }

    @Test
    void generateDailySummary_WithValidInput_ShouldReturnSummary() throws Exception {
        // Arrange
        Map<String, Object> request = new HashMap<>();
        request.put("date", "2024-01-15");
        request.put("timezoneOffsetMinutes", -300); // EST timezone
        
        when(dailySummaryService.generateDailySummary(eq(testUserId), eq(testDate), any(ZoneOffset.class)))
            .thenReturn(testSummary);

        // Act
        ResponseEntity<?> response = dailySummaryController.generateDailySummary(testUserId, request);

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(testSummary, response.getBody());
        verify(dailySummaryService).generateDailySummary(eq(testUserId), eq(testDate), any(ZoneOffset.class));
    }

    @Test
    void generateDailySummary_WithInvalidDate_ShouldReturnInternalServerError() {
        // Arrange
        Map<String, Object> request = new HashMap<>();
        request.put("date", "invalid-date");
        request.put("timezoneOffsetMinutes", -300);

        // Act
        ResponseEntity<?> response = dailySummaryController.generateDailySummary(testUserId, request);

        // Assert
        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, response.getStatusCode());
        assertTrue(response.getBody().toString().contains("Failed to generate daily summary"));
    }

    @Test
    void generateDailySummary_WithMissingDate_ShouldReturnInternalServerError() {
        // Arrange
        Map<String, Object> request = new HashMap<>();
        request.put("timezoneOffsetMinutes", -300);

        // Act
        ResponseEntity<?> response = dailySummaryController.generateDailySummary(testUserId, request);

        // Assert
        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, response.getStatusCode());
        assertTrue(response.getBody().toString().contains("Failed to generate daily summary"));
    }

    @Test
    void generateDailySummary_WithMissingTimezoneOffset_ShouldReturnInternalServerError() {
        // Arrange
        Map<String, Object> request = new HashMap<>();
        request.put("date", "2024-01-15");

        // Act
        ResponseEntity<?> response = dailySummaryController.generateDailySummary(testUserId, request);

        // Assert
        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, response.getStatusCode());
        assertTrue(response.getBody().toString().contains("Failed to generate daily summary"));
    }

    @Test
    void generateDailySummary_WithServiceException_ShouldReturnInternalServerError() throws Exception {
        // Arrange
        Map<String, Object> request = new HashMap<>();
        request.put("date", "2024-01-15");
        request.put("timezoneOffsetMinutes", -300);
        
        when(dailySummaryService.generateDailySummary(anyString(), any(LocalDate.class), any(ZoneOffset.class)))
            .thenThrow(new RuntimeException("Service error"));

        // Act
        ResponseEntity<?> response = dailySummaryController.generateDailySummary(testUserId, request);

        // Assert
        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, response.getStatusCode());
        assertTrue(response.getBody().toString().contains("Failed to generate daily summary"));
    }

    @Test
    void canGenerateSummary_WithValidInput_ShouldReturnResponse() {
        // Arrange
        int timezoneOffsetMinutes = -300;
        when(dailySummaryService.canGenerateSummary(testUserId, testDate, ZoneOffset.ofTotalSeconds(-300 * 60)))
            .thenReturn(true);
        when(dailySummaryService.dailySummaryExists(testUserId, testDate)).thenReturn(false);

        // Act
        ResponseEntity<Map<String, Object>> response = dailySummaryController.canGenerateSummary(
            testUserId, testDate, timezoneOffsetMinutes);

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        Map<String, Object> responseBody = response.getBody();
        assertNotNull(responseBody);
        assertEquals(true, responseBody.get("canGenerate"));
        assertEquals(false, responseBody.get("exists"));
        assertEquals(testDate.toString(), responseBody.get("date"));
        verify(dailySummaryService).canGenerateSummary(testUserId, testDate, ZoneOffset.ofTotalSeconds(-300 * 60));
        verify(dailySummaryService).dailySummaryExists(testUserId, testDate);
    }

    @Test
    void canGenerateSummary_WithExistingSummary_ShouldReturnExistsTrue() {
        // Arrange
        int timezoneOffsetMinutes = -300;
        when(dailySummaryService.canGenerateSummary(testUserId, testDate, ZoneOffset.ofTotalSeconds(-300 * 60)))
            .thenReturn(false);
        when(dailySummaryService.dailySummaryExists(testUserId, testDate)).thenReturn(true);

        // Act
        ResponseEntity<Map<String, Object>> response = dailySummaryController.canGenerateSummary(
            testUserId, testDate, timezoneOffsetMinutes);

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        Map<String, Object> responseBody = response.getBody();
        assertNotNull(responseBody);
        assertEquals(false, responseBody.get("canGenerate"));
        assertEquals(true, responseBody.get("exists"));
        assertEquals(testDate.toString(), responseBody.get("date"));
    }

    @Test
    void deleteDailySummary_WithValidInput_ShouldReturnOk() {
        // Arrange
        doNothing().when(dailySummaryService).deleteDailySummary(testUserId, testDate);

        // Act
        ResponseEntity<?> response = dailySummaryController.deleteDailySummary(testUserId, testDate);

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNull(response.getBody());
        verify(dailySummaryService).deleteDailySummary(testUserId, testDate);
    }

    @Test
    void deleteDailySummary_WithServiceException_ShouldReturnInternalServerError() {
        // Arrange
        doThrow(new RuntimeException("Service error")).when(dailySummaryService).deleteDailySummary(testUserId, testDate);

        // Act
        ResponseEntity<?> response = dailySummaryController.deleteDailySummary(testUserId, testDate);

        // Assert
        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, response.getStatusCode());
        assertTrue(response.getBody() instanceof Map);
        Map<?, ?> responseBody = (Map<?, ?>) response.getBody();
        assertTrue(responseBody.get("error").toString().contains("Failed to delete daily summary"));
        verify(dailySummaryService).deleteDailySummary(testUserId, testDate);
    }

    @Test
    void deleteDailySummary_WithEmptyUserId_ShouldStillCallService() {
        // Arrange
        String emptyUserId = "";
        doNothing().when(dailySummaryService).deleteDailySummary(emptyUserId, testDate);

        // Act
        ResponseEntity<?> response = dailySummaryController.deleteDailySummary(emptyUserId, testDate);

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        verify(dailySummaryService).deleteDailySummary(emptyUserId, testDate);
    }

    @Test
    void generateDailySummary_WithNullRequest_ShouldReturnInternalServerError() throws Exception {
        // Act
        ResponseEntity<?> response = dailySummaryController.generateDailySummary(testUserId, null);

        // Assert
        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, response.getStatusCode());
        assertTrue(response.getBody().toString().contains("Failed to generate daily summary"));
    }
}
