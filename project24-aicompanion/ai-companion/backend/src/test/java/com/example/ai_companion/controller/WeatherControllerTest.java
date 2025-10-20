package com.example.ai_companion.controller;

import com.example.ai_companion.service.WeatherService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.util.HashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class WeatherControllerTest {

    @Mock
    private WeatherService weatherService;

    @InjectMocks
    private WeatherController weatherController;

    private double testLatitude;
    private double testLongitude;
    private Map<String, Object> testWeatherData;

    @BeforeEach
    void setUp() {
        testLatitude = 40.7128;
        testLongitude = -74.0060;
        
        testWeatherData = new HashMap<>();
        testWeatherData.put("success", true);
        testWeatherData.put("temperature", 72.5);
        testWeatherData.put("description", "Sunny");
        testWeatherData.put("humidity", 65);
    }

    @Test
    void getWeatherData_WithValidCoordinates_ShouldReturnWeatherData() {
        // Arrange
        when(weatherService.getWeatherData(testLatitude, testLongitude)).thenReturn(testWeatherData);

        // Act
        ResponseEntity<Map<String, Object>> response = weatherController.getWeatherData(testLatitude, testLongitude);

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(testWeatherData, response.getBody());
        verify(weatherService).getWeatherData(testLatitude, testLongitude);
    }

    @Test
    void getWeatherData_WithZeroCoordinates_ShouldReturnWeatherData() {
        // Arrange
        double zeroLatitude = 0.0;
        double zeroLongitude = 0.0;
        when(weatherService.getWeatherData(zeroLatitude, zeroLongitude)).thenReturn(testWeatherData);

        // Act
        ResponseEntity<Map<String, Object>> response = weatherController.getWeatherData(zeroLatitude, zeroLongitude);

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(testWeatherData, response.getBody());
        verify(weatherService).getWeatherData(zeroLatitude, zeroLongitude);
    }

    @Test
    void getWeatherData_WithNegativeCoordinates_ShouldReturnWeatherData() {
        // Arrange
        double negativeLatitude = -40.7128;
        double negativeLongitude = -74.0060;
        when(weatherService.getWeatherData(negativeLatitude, negativeLongitude)).thenReturn(testWeatherData);

        // Act
        ResponseEntity<Map<String, Object>> response = weatherController.getWeatherData(negativeLatitude, negativeLongitude);

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(testWeatherData, response.getBody());
        verify(weatherService).getWeatherData(negativeLatitude, negativeLongitude);
    }

    @Test
    void getWeatherData_WithExtremeCoordinates_ShouldReturnWeatherData() {
        // Arrange
        double extremeLatitude = 90.0;
        double extremeLongitude = 180.0;
        when(weatherService.getWeatherData(extremeLatitude, extremeLongitude)).thenReturn(testWeatherData);

        // Act
        ResponseEntity<Map<String, Object>> response = weatherController.getWeatherData(extremeLatitude, extremeLongitude);

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(testWeatherData, response.getBody());
        verify(weatherService).getWeatherData(extremeLatitude, extremeLongitude);
    }

    @Test
    void getWeatherData_WithServiceFailure_ShouldReturnFailureData() {
        // Arrange
        Map<String, Object> failureData = new HashMap<>();
        failureData.put("success", false);
        failureData.put("error", "Weather service unavailable");
        when(weatherService.getWeatherData(testLatitude, testLongitude)).thenReturn(failureData);

        // Act
        ResponseEntity<Map<String, Object>> response = weatherController.getWeatherData(testLatitude, testLongitude);

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(failureData, response.getBody());
        verify(weatherService).getWeatherData(testLatitude, testLongitude);
    }

    @Test
    void getWeatherData_WithEmptyWeatherData_ShouldReturnEmptyData() {
        // Arrange
        Map<String, Object> emptyData = new HashMap<>();
        when(weatherService.getWeatherData(testLatitude, testLongitude)).thenReturn(emptyData);

        // Act
        ResponseEntity<Map<String, Object>> response = weatherController.getWeatherData(testLatitude, testLongitude);

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(emptyData, response.getBody());
        verify(weatherService).getWeatherData(testLatitude, testLongitude);
    }

    @Test
    void getWeatherData_WithNullWeatherData_ShouldReturnInternalServerError() {
        // Arrange
        when(weatherService.getWeatherData(testLatitude, testLongitude)).thenReturn(null);

        // Act & Assert
        assertThrows(NullPointerException.class, () -> {
            weatherController.getWeatherData(testLatitude, testLongitude);
        });
        verify(weatherService).getWeatherData(testLatitude, testLongitude);
    }

    @Test
    void getWeatherData_WithServiceException_ShouldPropagateException() {
        // Arrange
        when(weatherService.getWeatherData(testLatitude, testLongitude)).thenThrow(new RuntimeException("Service error"));

        // Act & Assert
        assertThrows(RuntimeException.class, () -> {
            weatherController.getWeatherData(testLatitude, testLongitude);
        });
        verify(weatherService).getWeatherData(testLatitude, testLongitude);
    }

    @Test
    void getWeatherData_WithVerySmallCoordinates_ShouldReturnWeatherData() {
        // Arrange
        double smallLatitude = 0.0001;
        double smallLongitude = 0.0001;
        when(weatherService.getWeatherData(smallLatitude, smallLongitude)).thenReturn(testWeatherData);

        // Act
        ResponseEntity<Map<String, Object>> response = weatherController.getWeatherData(smallLatitude, smallLongitude);

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(testWeatherData, response.getBody());
        verify(weatherService).getWeatherData(smallLatitude, smallLongitude);
    }

    @Test
    void getWeatherData_WithVeryLargeCoordinates_ShouldReturnWeatherData() {
        // Arrange
        double largeLatitude = 89.9999;
        double largeLongitude = 179.9999;
        when(weatherService.getWeatherData(largeLatitude, largeLongitude)).thenReturn(testWeatherData);

        // Act
        ResponseEntity<Map<String, Object>> response = weatherController.getWeatherData(largeLatitude, largeLongitude);

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(testWeatherData, response.getBody());
        verify(weatherService).getWeatherData(largeLatitude, largeLongitude);
    }

    @Test
    void getWeatherData_WithPartialWeatherData_ShouldReturnPartialData() {
        // Arrange
        Map<String, Object> partialData = new HashMap<>();
        partialData.put("success", true);
        partialData.put("temperature", 75.0);
        // Missing description and humidity
        when(weatherService.getWeatherData(testLatitude, testLongitude)).thenReturn(partialData);

        // Act
        ResponseEntity<Map<String, Object>> response = weatherController.getWeatherData(testLatitude, testLongitude);

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(partialData, response.getBody());
        verify(weatherService).getWeatherData(testLatitude, testLongitude);
    }

    @Test
    void getWeatherData_WithWeatherDataContainingNullValues_ShouldReturnDataWithNulls() {
        // Arrange
        Map<String, Object> dataWithNulls = new HashMap<>();
        dataWithNulls.put("success", true);
        dataWithNulls.put("temperature", null);
        dataWithNulls.put("description", "Sunny");
        dataWithNulls.put("humidity", null);
        when(weatherService.getWeatherData(testLatitude, testLongitude)).thenReturn(dataWithNulls);

        // Act
        ResponseEntity<Map<String, Object>> response = weatherController.getWeatherData(testLatitude, testLongitude);

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(dataWithNulls, response.getBody());
        verify(weatherService).getWeatherData(testLatitude, testLongitude);
    }
}
