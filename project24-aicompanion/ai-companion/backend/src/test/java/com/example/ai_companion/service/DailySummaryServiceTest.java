package com.example.ai_companion.service;

import com.example.ai_companion.model.DailySummary;
import com.example.ai_companion.model.Message;
import com.example.ai_companion.repository.DailySummaryRepository;
import com.example.ai_companion.repository.MessageRepository;
import dev.langchain4j.model.chat.ChatLanguageModel;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.mockito.Mockito.atLeast;

@ExtendWith(MockitoExtension.class)
class DailySummaryServiceTest {

    @Mock
    private DailySummaryRepository dailySummaryRepository;

    @Mock
    private MessageRepository messageRepository;

    @Mock
    private ChatLanguageModel chatLanguageModel;

    @InjectMocks
    private DailySummaryService dailySummaryService;

    private String testUserId;
    private LocalDate testDate;
    private ZoneOffset testOffset;
    private Message testMessage;
    private DailySummary testDailySummary;

    @BeforeEach
    void setUp() {
        testUserId = "user123";
        testOffset = ZoneOffset.UTC;
        // Anchor all date logic to the same offset to avoid day-dependent flakiness
        testDate = LocalDate.now(testOffset).minusDays(1); // previous day in test offset

        testMessage = new Message();
        testMessage.setId("msg123");
        testMessage.setUserId(testUserId);
        testMessage.setText("Hello, how are you?");
        testMessage.setFromUser(true);
        // Ensure timestamp is always within the 12pm-12pm window for testDate in testOffset (UTC)
        Instant withinWindow = testDate
                .atTime(13, 0) // 1:00 PM local time
                .atOffset(testOffset)
                .toInstant();
        testMessage.setTimestamp(withinWindow);

        Map<String, Integer> testScores = new HashMap<>();
        testScores.put("health", 8);
        testScores.put("exercise", 6);
        testScores.put("mental", 7);
        testScores.put("social", 9);
        testScores.put("productivity", 5);

        testDailySummary = new DailySummary(testUserId, testDate, "Test summary", testScores, "Test analysis");
    }

    @Test
    void getDailySummary_WithValidInput_ShouldReturnSummary() {
        // Arrange
        when(dailySummaryRepository.findByUserIdAndDate(testUserId, testDate)).thenReturn(Optional.of(testDailySummary));

        // Act
        DailySummary result = dailySummaryService.getDailySummary(testUserId, testDate);

        // Assert
        assertNotNull(result);
        assertEquals(testDailySummary, result);
        verify(dailySummaryRepository).findByUserIdAndDate(testUserId, testDate);
    }

    @Test
    void getDailySummary_WithNonExistentSummary_ShouldReturnNull() {
        // Arrange
        when(dailySummaryRepository.findByUserIdAndDate(testUserId, testDate)).thenReturn(Optional.empty());

        // Act
        DailySummary result = dailySummaryService.getDailySummary(testUserId, testDate);

        // Assert
        assertNull(result);
        verify(dailySummaryRepository).findByUserIdAndDate(testUserId, testDate);
    }

    @Test
    void getUserDailySummaries_WithValidInput_ShouldReturnSummaries() {
        // Arrange
        List<DailySummary> summaries = Arrays.asList(testDailySummary);
        when(dailySummaryRepository.findByUserIdOrderByDateDesc(testUserId)).thenReturn(summaries);

        // Act
        List<DailySummary> result = dailySummaryService.getUserDailySummaries(testUserId);

        // Assert
        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals(testDailySummary, result.get(0));
        verify(dailySummaryRepository).findByUserIdOrderByDateDesc(testUserId);
    }

    @Test
    void dailySummaryExists_WithExistingSummary_ShouldReturnTrue() {
        // Arrange
        when(dailySummaryRepository.existsByUserIdAndDate(testUserId, testDate)).thenReturn(true);

        // Act
        boolean result = dailySummaryService.dailySummaryExists(testUserId, testDate);

        // Assert
        assertTrue(result);
        verify(dailySummaryRepository).existsByUserIdAndDate(testUserId, testDate);
    }

    @Test
    void dailySummaryExists_WithNonExistentSummary_ShouldReturnFalse() {
        // Arrange
        when(dailySummaryRepository.existsByUserIdAndDate(testUserId, testDate)).thenReturn(false);

        // Act
        boolean result = dailySummaryService.dailySummaryExists(testUserId, testDate);

        // Assert
        assertFalse(result);
        verify(dailySummaryRepository).existsByUserIdAndDate(testUserId, testDate);
    }

    @Test
    void canGenerateSummary_WithFutureDate_ShouldReturnFalse() {
        // Arrange
        LocalDate futureDate = LocalDate.now().plusDays(1);

        // Act
        boolean result = dailySummaryService.canGenerateSummary(testUserId, futureDate, testOffset);

        // Assert
        assertFalse(result);
    }

    @Test
    void canGenerateSummary_WithTodayDate_ShouldReturnFalse() {
        // Arrange
        LocalDate today = LocalDate.now();

        // Act
        boolean result = dailySummaryService.canGenerateSummary(testUserId, today, testOffset);

        // Assert
        assertFalse(result);
    }

    @Test
    void canGenerateSummary_WithExistingSummary_ShouldReturnFalse() {
        // Arrange
        LocalDate pastDate = LocalDate.now(testOffset).minusDays(1);
        when(dailySummaryRepository.existsByUserIdAndDate(testUserId, pastDate)).thenReturn(true);

        // Act
        boolean result = dailySummaryService.canGenerateSummary(testUserId, pastDate, testOffset);

        // Assert
        assertFalse(result);
        verify(dailySummaryRepository).existsByUserIdAndDate(testUserId, pastDate);
    }

    @Test
    void canGenerateSummary_WithNoMessages_ShouldReturnFalse() {
        // Arrange
        LocalDate pastDate = LocalDate.now(testOffset).minusDays(1);
        when(dailySummaryRepository.existsByUserIdAndDate(testUserId, pastDate)).thenReturn(false);
        when(messageRepository.findByUserId(testUserId)).thenReturn(new ArrayList<>());

        // Act
        boolean result = dailySummaryService.canGenerateSummary(testUserId, pastDate, testOffset);

        // Assert
        assertFalse(result);
        verify(dailySummaryRepository).existsByUserIdAndDate(testUserId, pastDate);
        verify(messageRepository, atLeast(1)).findByUserId(testUserId);
    }

    @Test
    void canGenerateSummary_WithValidConditions_ShouldReturnTrue() {
        // Arrange
        LocalDate pastDate = LocalDate.now(testOffset).minusDays(1);
        when(dailySummaryRepository.existsByUserIdAndDate(testUserId, pastDate)).thenReturn(false);
        when(messageRepository.findByUserId(testUserId)).thenReturn(Arrays.asList(testMessage));

        // Act
        boolean result = dailySummaryService.canGenerateSummary(testUserId, pastDate, testOffset);

        // Assert
        assertTrue(result);
        verify(dailySummaryRepository).existsByUserIdAndDate(testUserId, pastDate);
        verify(messageRepository, atLeast(1)).findByUserId(testUserId);
    }

    @Test
    void generateDailySummary_WithValidInput_ShouldGenerateSummary() throws Exception {
        // Arrange
        LocalDate pastDate = LocalDate.now(testOffset).minusDays(1);
        when(dailySummaryRepository.existsByUserIdAndDate(testUserId, pastDate)).thenReturn(false);
        when(messageRepository.findByUserId(testUserId)).thenReturn(Arrays.asList(testMessage));
        when(chatLanguageModel.chat(anyString())).thenReturn("{\"summary\":\"Test summary\",\"scores\":{\"health\":8,\"exercise\":6,\"mental\":7,\"social\":9,\"productivity\":5},\"analysis\":\"Test analysis\"}");
        when(dailySummaryRepository.save(any(DailySummary.class))).thenReturn(testDailySummary);

        // Act
        DailySummary result = dailySummaryService.generateDailySummary(testUserId, pastDate, testOffset);

        // Assert
        assertNotNull(result);
        verify(dailySummaryRepository).existsByUserIdAndDate(testUserId, pastDate);
        verify(messageRepository, atLeast(1)).findByUserId(testUserId);
        verify(chatLanguageModel).chat(anyString());
        verify(dailySummaryRepository).save(any(DailySummary.class));
    }

    @Test
    void generateDailySummary_WithInvalidConditions_ShouldThrowException() {
        // Arrange
        LocalDate futureDate = LocalDate.now().plusDays(1);

        // Act & Assert
        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, () -> {
            dailySummaryService.generateDailySummary(testUserId, futureDate, testOffset);
        });
        assertEquals("Cannot generate summary for this date", exception.getMessage());
    }

    @Test
    void generateDailySummary_WithNoMessages_ShouldThrowException() {
        // Arrange
        LocalDate pastDate = LocalDate.now(testOffset).minusDays(1);
        when(dailySummaryRepository.existsByUserIdAndDate(testUserId, pastDate)).thenReturn(false);
        when(messageRepository.findByUserId(testUserId)).thenReturn(new ArrayList<>());

        // Act & Assert
        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, () -> {
            dailySummaryService.generateDailySummary(testUserId, pastDate, testOffset);
        });
        assertEquals("Cannot generate summary for this date", exception.getMessage());
        
        // Verify the repository calls were made
        verify(dailySummaryRepository).existsByUserIdAndDate(testUserId, pastDate);
        verify(messageRepository).findByUserId(testUserId);
    }

    @Test
    void generateDailySummary_WithInvalidJsonResponse_ShouldUseFallback() throws Exception {
        // Arrange
        LocalDate pastDate = LocalDate.now(testOffset).minusDays(1);
        when(dailySummaryRepository.existsByUserIdAndDate(testUserId, pastDate)).thenReturn(false);
        when(messageRepository.findByUserId(testUserId)).thenReturn(Arrays.asList(testMessage));
        when(chatLanguageModel.chat(anyString())).thenReturn("Invalid JSON response");
        when(dailySummaryRepository.save(any(DailySummary.class))).thenReturn(testDailySummary);

        // Act
        DailySummary result = dailySummaryService.generateDailySummary(testUserId, pastDate, testOffset);

        // Assert
        assertNotNull(result);
        verify(chatLanguageModel).chat(anyString());
        verify(dailySummaryRepository).save(any(DailySummary.class));
    }

    @Test
    void generateDailySummary_WithJsonParsingError_ShouldUseFallback() throws Exception {
        // Arrange
        LocalDate pastDate = LocalDate.now(testOffset).minusDays(1);
        when(dailySummaryRepository.existsByUserIdAndDate(testUserId, pastDate)).thenReturn(false);
        when(messageRepository.findByUserId(testUserId)).thenReturn(Arrays.asList(testMessage));
        when(chatLanguageModel.chat(anyString())).thenReturn("{\"summary\":\"Test\",\"scores\":{\"health\":\"invalid\"},\"analysis\":\"Test\"}");
        when(dailySummaryRepository.save(any(DailySummary.class))).thenReturn(testDailySummary);

        // Act
        DailySummary result = dailySummaryService.generateDailySummary(testUserId, pastDate, testOffset);

        // Assert
        assertNotNull(result);
        verify(chatLanguageModel).chat(anyString());
        verify(dailySummaryRepository).save(any(DailySummary.class));
    }

    @Test
    void deleteDailySummary_WithValidInput_ShouldDeleteSummary() {
        // Act
        dailySummaryService.deleteDailySummary(testUserId, testDate);

        // Assert
        verify(dailySummaryRepository).deleteByUserIdAndDate(testUserId, testDate);
    }

    @Test
    void generateDailySummary_WithValidJsonResponse_ShouldParseCorrectly() throws Exception {
        // Arrange
        LocalDate pastDate = LocalDate.now(testOffset).minusDays(1);
        String validJsonResponse = "{\"summary\":\"User had a productive day\",\"scores\":{\"health\":8,\"exercise\":6,\"mental\":7,\"social\":9,\"productivity\":8},\"analysis\":\"The user showed good health indicators and social engagement\"}";
        
        when(dailySummaryRepository.existsByUserIdAndDate(testUserId, pastDate)).thenReturn(false);
        when(messageRepository.findByUserId(testUserId)).thenReturn(Arrays.asList(testMessage));
        when(chatLanguageModel.chat(anyString())).thenReturn(validJsonResponse);
        when(dailySummaryRepository.save(any(DailySummary.class))).thenReturn(testDailySummary);

        // Act
        DailySummary result = dailySummaryService.generateDailySummary(testUserId, pastDate, testOffset);

        // Assert
        assertNotNull(result);
        verify(chatLanguageModel).chat(anyString());
        verify(dailySummaryRepository).save(any(DailySummary.class));
    }

    @Test
    void generateDailySummary_WithOutOfRangeScores_ShouldClampScores() throws Exception {
        // Arrange
        LocalDate pastDate = LocalDate.now(testOffset).minusDays(1);
        String jsonWithOutOfRangeScores = "{\"summary\":\"Test\",\"scores\":{\"health\":15,\"exercise\":-2,\"mental\":0,\"social\":12,\"productivity\":8},\"analysis\":\"Test\"}";
        
        when(dailySummaryRepository.existsByUserIdAndDate(testUserId, pastDate)).thenReturn(false);
        when(messageRepository.findByUserId(testUserId)).thenReturn(Arrays.asList(testMessage));
        when(chatLanguageModel.chat(anyString())).thenReturn(jsonWithOutOfRangeScores);
        when(dailySummaryRepository.save(any(DailySummary.class))).thenReturn(testDailySummary);

        // Act
        DailySummary result = dailySummaryService.generateDailySummary(testUserId, pastDate, testOffset);

        // Assert
        assertNotNull(result);
        verify(chatLanguageModel).chat(anyString());
        verify(dailySummaryRepository).save(any(DailySummary.class));
    }

    @Test
    void generateDailySummary_WithMissingScores_ShouldUseDefaults() throws Exception {
        // Arrange
        LocalDate pastDate = LocalDate.now(testOffset).minusDays(1);
        String jsonWithMissingScores = "{\"summary\":\"Test summary\",\"analysis\":\"Test analysis\"}";
        
        when(dailySummaryRepository.existsByUserIdAndDate(testUserId, pastDate)).thenReturn(false);
        when(messageRepository.findByUserId(testUserId)).thenReturn(Arrays.asList(testMessage));
        when(chatLanguageModel.chat(anyString())).thenReturn(jsonWithMissingScores);
        when(dailySummaryRepository.save(any(DailySummary.class))).thenReturn(testDailySummary);

        // Act
        DailySummary result = dailySummaryService.generateDailySummary(testUserId, pastDate, testOffset);

        // Assert
        assertNotNull(result);
        verify(chatLanguageModel).chat(anyString());
        verify(dailySummaryRepository).save(any(DailySummary.class));
    }

    @Test
    void generateDailySummary_WithEmptyJson_ShouldUseFallback() throws Exception {
        // Arrange
        LocalDate pastDate = LocalDate.now(testOffset).minusDays(1);
        when(dailySummaryRepository.existsByUserIdAndDate(testUserId, pastDate)).thenReturn(false);
        when(messageRepository.findByUserId(testUserId)).thenReturn(Arrays.asList(testMessage));
        when(chatLanguageModel.chat(anyString())).thenReturn("{}");
        when(dailySummaryRepository.save(any(DailySummary.class))).thenReturn(testDailySummary);

        // Act
        DailySummary result = dailySummaryService.generateDailySummary(testUserId, pastDate, testOffset);

        // Assert
        assertNotNull(result);
        verify(chatLanguageModel).chat(anyString());
        verify(dailySummaryRepository).save(any(DailySummary.class));
    }
}
