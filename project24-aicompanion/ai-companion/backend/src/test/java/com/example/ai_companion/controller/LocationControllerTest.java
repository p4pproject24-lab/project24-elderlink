package com.example.ai_companion.controller;

import com.example.ai_companion.model.Location;
import com.example.ai_companion.service.LocationService;
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
class LocationControllerTest {

    @Mock
    private LocationService locationService;

    @InjectMocks
    private LocationController locationController;

    private Location testLocation;
    private String testUserId;
    private String testLocationId;

    @BeforeEach
    void setUp() {
        testUserId = "user123";
        testLocationId = "location123";
        
        testLocation = new Location(
            testUserId,
            40.7128,
            -74.0060,
            Instant.now()
        );
        testLocation.setId(testLocationId);
    }

    @Test
    void saveLocation_WithValidPayload_ShouldReturnSavedLocation() {
        // Arrange
        Map<String, Object> payload = new HashMap<>();
        payload.put("userId", testUserId);
        payload.put("latitude", 40.7128);
        payload.put("longitude", -74.0060);
        payload.put("timestamp", Instant.now().toString());

        when(locationService.saveLocation(eq(testUserId), eq(40.7128), eq(-74.0060), any(Instant.class)))
            .thenReturn(testLocation);

        // Act
        ResponseEntity<Location> response = locationController.saveLocation(payload);

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(testLocation, response.getBody());
        verify(locationService).saveLocation(eq(testUserId), eq(40.7128), eq(-74.0060), any(Instant.class));
    }

    @Test
    void saveLocation_WithPayloadWithoutTimestamp_ShouldUseCurrentTime() {
        // Arrange
        Map<String, Object> payload = new HashMap<>();
        payload.put("userId", testUserId);
        payload.put("latitude", 40.7128);
        payload.put("longitude", -74.0060);

        when(locationService.saveLocation(eq(testUserId), eq(40.7128), eq(-74.0060), any(Instant.class)))
            .thenReturn(testLocation);

        // Act
        ResponseEntity<Location> response = locationController.saveLocation(payload);

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(testLocation, response.getBody());
        verify(locationService).saveLocation(eq(testUserId), eq(40.7128), eq(-74.0060), any(Instant.class));
    }

    @Test
    void saveLocation_WithIntegerCoordinates_ShouldConvertToDouble() {
        // Arrange
        Map<String, Object> payload = new HashMap<>();
        payload.put("userId", testUserId);
        payload.put("latitude", 40);
        payload.put("longitude", -74);

        when(locationService.saveLocation(eq(testUserId), eq(40.0), eq(-74.0), any(Instant.class)))
            .thenReturn(testLocation);

        // Act
        ResponseEntity<Location> response = locationController.saveLocation(payload);

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(testLocation, response.getBody());
        verify(locationService).saveLocation(eq(testUserId), eq(40.0), eq(-74.0), any(Instant.class));
    }

    @Test
    void saveLocation_WithFloatCoordinates_ShouldConvertToDouble() {
        // Arrange
        Map<String, Object> payload = new HashMap<>();
        payload.put("userId", testUserId);
        payload.put("latitude", 40.5f);
        payload.put("longitude", -74.5f);

        when(locationService.saveLocation(eq(testUserId), eq(40.5), eq(-74.5), any(Instant.class)))
            .thenReturn(testLocation);

        // Act
        ResponseEntity<Location> response = locationController.saveLocation(payload);

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(testLocation, response.getBody());
        verify(locationService).saveLocation(eq(testUserId), eq(40.5), eq(-74.5), any(Instant.class));
    }

    @Test
    void saveLocation_WithNullPayload_ShouldThrowException() {
        // Act & Assert
        assertThrows(NullPointerException.class, () -> {
            locationController.saveLocation(null);
        });
    }

    @Test
    void saveLocation_WithMissingUserId_ShouldReturnOk() {
        // Arrange
        Map<String, Object> payload = new HashMap<>();
        payload.put("latitude", 40.7128);
        payload.put("longitude", -74.0060);

        // Act
        ResponseEntity<Location> response = locationController.saveLocation(payload);

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
    }

    @Test
    void saveLocation_WithMissingLatitude_ShouldThrowException() {
        // Arrange
        Map<String, Object> payload = new HashMap<>();
        payload.put("userId", testUserId);
        payload.put("longitude", -74.0060);

        // Act & Assert
        assertThrows(NullPointerException.class, () -> {
            locationController.saveLocation(payload);
        });
    }

    @Test
    void saveLocation_WithMissingLongitude_ShouldThrowException() {
        // Arrange
        Map<String, Object> payload = new HashMap<>();
        payload.put("userId", testUserId);
        payload.put("latitude", 40.7128);

        // Act & Assert
        assertThrows(NullPointerException.class, () -> {
            locationController.saveLocation(payload);
        });
    }

    @Test
    void getUserLocations_WithValidUserId_ShouldReturnLocations() {
        // Arrange
        int page = 0;
        int size = 10;
        List<Location> locations = Arrays.asList(testLocation);
        Page<Location> locationPage = new PageImpl<>(locations);
        when(locationService.getUserLocations(eq(testUserId), any(Pageable.class))).thenReturn(locationPage);

        // Act
        ResponseEntity<List<Location>> response = locationController.getUserLocations(testUserId, page, size);

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(locations, response.getBody());
        verify(locationService).getUserLocations(eq(testUserId), any(Pageable.class));
    }

    @Test
    void getUserLocations_WithDefaultParameters_ShouldUseDefaults() {
        // Arrange
        List<Location> locations = Arrays.asList(testLocation);
        Page<Location> locationPage = new PageImpl<>(locations);
        when(locationService.getUserLocations(eq(testUserId), any(Pageable.class))).thenReturn(locationPage);

        // Act
        ResponseEntity<List<Location>> response = locationController.getUserLocations(testUserId, 0, 10);

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(locations, response.getBody());
        verify(locationService).getUserLocations(eq(testUserId), any(Pageable.class));
    }

    @Test
    void getUserLocations_WithEmptyUserId_ShouldReturnEmptyList() {
        // Arrange
        String emptyUserId = "";
        List<Location> emptyLocations = Collections.emptyList();
        Page<Location> emptyPage = new PageImpl<>(emptyLocations);
        when(locationService.getUserLocations(eq(emptyUserId), any(Pageable.class))).thenReturn(emptyPage);

        // Act
        ResponseEntity<List<Location>> response = locationController.getUserLocations(emptyUserId, 0, 10);

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(emptyLocations, response.getBody());
        verify(locationService).getUserLocations(eq(emptyUserId), any(Pageable.class));
    }

    @Test
    void getUserLocations_WithLargePageSize_ShouldReturnLocations() {
        // Arrange
        int page = 1;
        int size = 50;
        List<Location> locations = Arrays.asList(testLocation);
        Page<Location> locationPage = new PageImpl<>(locations);
        when(locationService.getUserLocations(eq(testUserId), any(Pageable.class))).thenReturn(locationPage);

        // Act
        ResponseEntity<List<Location>> response = locationController.getUserLocations(testUserId, page, size);

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(locations, response.getBody());
        verify(locationService).getUserLocations(eq(testUserId), any(Pageable.class));
    }

    @Test
    void getUserLocations_WithMinimumPageSize_ShouldStillCallService() {
        // Arrange
        int page = 0;
        int size = 1; // Minimum valid page size
        List<Location> locations = Arrays.asList(testLocation);
        Page<Location> locationPage = new PageImpl<>(locations);
        when(locationService.getUserLocations(eq(testUserId), any(Pageable.class))).thenReturn(locationPage);

        // Act
        ResponseEntity<List<Location>> response = locationController.getUserLocations(testUserId, page, size);

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        verify(locationService).getUserLocations(eq(testUserId), any(Pageable.class));
    }

    @Test
    void saveLocation_WithServiceException_ShouldPropagateException() {
        // Arrange
        Map<String, Object> payload = new HashMap<>();
        payload.put("userId", testUserId);
        payload.put("latitude", 40.7128);
        payload.put("longitude", -74.0060);

        when(locationService.saveLocation(anyString(), anyDouble(), anyDouble(), any(Instant.class)))
            .thenThrow(new RuntimeException("Service error"));

        // Act & Assert
        assertThrows(RuntimeException.class, () -> {
            locationController.saveLocation(payload);
        });
    }

    @Test
    void getUserLocations_WithServiceException_ShouldPropagateException() {
        // Arrange
        when(locationService.getUserLocations(anyString(), any(Pageable.class)))
            .thenThrow(new RuntimeException("Service error"));

        // Act & Assert
        assertThrows(RuntimeException.class, () -> {
            locationController.getUserLocations(testUserId, 0, 10);
        });
    }
}
