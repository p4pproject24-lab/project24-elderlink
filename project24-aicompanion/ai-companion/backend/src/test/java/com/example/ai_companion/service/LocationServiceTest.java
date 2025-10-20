package com.example.ai_companion.service;

import com.example.ai_companion.model.Location;
import com.example.ai_companion.repository.LocationRepository;
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

import java.time.Instant;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class LocationServiceTest {

    @Mock
    private LocationRepository locationRepository;

    @InjectMocks
    private LocationService locationService;

    private String testUserId;
    private double testLatitude;
    private double testLongitude;
    private Instant testTimestamp;
    private Location testLocation;

    @BeforeEach
    void setUp() {
        testUserId = "test-firebase-uid-123456789012345";
        testLatitude = 40.7128;
        testLongitude = -74.0060;
        testTimestamp = Instant.now();
        
        testLocation = new Location(testUserId, testLatitude, testLongitude, testTimestamp);
        testLocation.setId("location-id-123");
    }

    @Test
    void saveLocation_WithValidInput_ShouldSaveAndReturnLocation() {
        // Arrange
        when(locationRepository.save(any(Location.class))).thenReturn(testLocation);

        // Act
        Location result = locationService.saveLocation(testUserId, testLatitude, testLongitude, testTimestamp);

        // Assert
        assertNotNull(result);
        assertEquals(testLocation.getId(), result.getId());
        assertEquals(testUserId, result.getUserId());
        assertEquals(testLatitude, result.getLatitude());
        assertEquals(testLongitude, result.getLongitude());
        assertEquals(testTimestamp, result.getTimestamp());
        verify(locationRepository).save(any(Location.class));
    }

    @Test
    void saveLocation_WithNullUserId_ShouldThrowException() {
        // Act & Assert
        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, () -> {
            locationService.saveLocation(null, testLatitude, testLongitude, testTimestamp);
        });

        assertEquals("User ID cannot be null or empty", exception.getMessage());
        verify(locationRepository, never()).save(any(Location.class));
    }

    @Test
    void saveLocation_WithEmptyUserId_ShouldThrowException() {
        // Act & Assert
        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, () -> {
            locationService.saveLocation("", testLatitude, testLongitude, testTimestamp);
        });

        assertEquals("User ID cannot be null or empty", exception.getMessage());
        verify(locationRepository, never()).save(any(Location.class));
    }

    @Test
    void saveLocation_WithWhitespaceUserId_ShouldThrowException() {
        // Act & Assert
        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, () -> {
            locationService.saveLocation("   ", testLatitude, testLongitude, testTimestamp);
        });

        assertEquals("User ID cannot be null or empty", exception.getMessage());
        verify(locationRepository, never()).save(any(Location.class));
    }

    @Test
    void saveLocation_WithShortUserId_ShouldStillSave() {
        // Arrange
        String shortUserId = "short-uid";
        when(locationRepository.save(any(Location.class))).thenReturn(testLocation);

        // Act
        Location result = locationService.saveLocation(shortUserId, testLatitude, testLongitude, testTimestamp);

        // Assert
        assertNotNull(result);
        verify(locationRepository).save(any(Location.class));
    }

    @Test
    void saveLocation_WithValidFirebaseUid_ShouldSave() {
        // Arrange
        String validFirebaseUid = "valid-firebase-uid-28-chars-long";
        when(locationRepository.save(any(Location.class))).thenReturn(testLocation);

        // Act
        Location result = locationService.saveLocation(validFirebaseUid, testLatitude, testLongitude, testTimestamp);

        // Assert
        assertNotNull(result);
        verify(locationRepository).save(any(Location.class));
    }

    @Test
    void saveLocation_WithZeroCoordinates_ShouldSave() {
        // Arrange
        when(locationRepository.save(any(Location.class))).thenReturn(testLocation);

        // Act
        Location result = locationService.saveLocation(testUserId, 0.0, 0.0, testTimestamp);

        // Assert
        assertNotNull(result);
        verify(locationRepository).save(any(Location.class));
    }

    @Test
    void saveLocation_WithNegativeCoordinates_ShouldSave() {
        // Arrange
        when(locationRepository.save(any(Location.class))).thenReturn(testLocation);

        // Act
        Location result = locationService.saveLocation(testUserId, -90.0, -180.0, testTimestamp);

        // Assert
        assertNotNull(result);
        verify(locationRepository).save(any(Location.class));
    }

    @Test
    void saveLocation_WithNullTimestamp_ShouldSave() {
        // Arrange
        when(locationRepository.save(any(Location.class))).thenReturn(testLocation);

        // Act
        Location result = locationService.saveLocation(testUserId, testLatitude, testLongitude, null);

        // Assert
        assertNotNull(result);
        verify(locationRepository).save(any(Location.class));
    }

    @Test
    void getUserLocations_WithValidUserId_ShouldReturnLocations() {
        // Arrange
        List<Location> expectedLocations = Arrays.asList(testLocation);
        when(locationRepository.findByUserIdOrderByTimestampDesc(testUserId)).thenReturn(expectedLocations);

        // Act
        List<Location> result = locationService.getUserLocations(testUserId);

        // Assert
        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals(testLocation.getId(), result.get(0).getId());
        verify(locationRepository).findByUserIdOrderByTimestampDesc(testUserId);
    }

    @Test
    void getUserLocations_WithNullUserId_ShouldThrowException() {
        // Act & Assert
        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, () -> {
            locationService.getUserLocations(null);
        });

        assertEquals("User ID cannot be null or empty", exception.getMessage());
        verify(locationRepository, never()).findByUserIdOrderByTimestampDesc(anyString());
    }

    @Test
    void getUserLocations_WithEmptyUserId_ShouldThrowException() {
        // Act & Assert
        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, () -> {
            locationService.getUserLocations("");
        });

        assertEquals("User ID cannot be null or empty", exception.getMessage());
        verify(locationRepository, never()).findByUserIdOrderByTimestampDesc(anyString());
    }

    @Test
    void getUserLocations_WithWhitespaceUserId_ShouldThrowException() {
        // Act & Assert
        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, () -> {
            locationService.getUserLocations("   ");
        });

        assertEquals("User ID cannot be null or empty", exception.getMessage());
        verify(locationRepository, never()).findByUserIdOrderByTimestampDesc(anyString());
    }

    @Test
    void getUserLocations_WithNoLocations_ShouldReturnEmptyList() {
        // Arrange
        when(locationRepository.findByUserIdOrderByTimestampDesc(testUserId)).thenReturn(Collections.emptyList());

        // Act
        List<Location> result = locationService.getUserLocations(testUserId);

        // Assert
        assertNotNull(result);
        assertTrue(result.isEmpty());
        verify(locationRepository).findByUserIdOrderByTimestampDesc(testUserId);
    }

    @Test
    void getUserLocations_WithMultipleLocations_ShouldReturnAllLocations() {
        // Arrange
        Location location1 = new Location(testUserId, 40.7128, -74.0060, Instant.now());
        Location location2 = new Location(testUserId, 41.8781, -87.6298, Instant.now().plusSeconds(3600));
        List<Location> expectedLocations = Arrays.asList(location2, location1); // Ordered by timestamp desc
        when(locationRepository.findByUserIdOrderByTimestampDesc(testUserId)).thenReturn(expectedLocations);

        // Act
        List<Location> result = locationService.getUserLocations(testUserId);

        // Assert
        assertNotNull(result);
        assertEquals(2, result.size());
        verify(locationRepository).findByUserIdOrderByTimestampDesc(testUserId);
    }

    @Test
    void getUserLocations_WithPageable_WithValidInput_ShouldReturnPage() {
        // Arrange
        Pageable pageable = PageRequest.of(0, 10);
        Page<Location> expectedPage = new PageImpl<>(Arrays.asList(testLocation), pageable, 1);
        when(locationRepository.findByUserIdOrderByTimestampDesc(testUserId, pageable)).thenReturn(expectedPage);

        // Act
        Page<Location> result = locationService.getUserLocations(testUserId, pageable);

        // Assert
        assertNotNull(result);
        assertEquals(1, result.getContent().size());
        assertEquals(1, result.getTotalElements());
        assertEquals(1, result.getTotalPages());
        verify(locationRepository).findByUserIdOrderByTimestampDesc(testUserId, pageable);
    }

    @Test
    void getUserLocations_WithPageable_WithNullUserId_ShouldThrowException() {
        // Arrange
        Pageable pageable = PageRequest.of(0, 10);

        // Act & Assert
        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, () -> {
            locationService.getUserLocations(null, pageable);
        });

        assertEquals("User ID cannot be null or empty", exception.getMessage());
        verify(locationRepository, never()).findByUserIdOrderByTimestampDesc(anyString(), any(Pageable.class));
    }

    @Test
    void getUserLocations_WithPageable_WithEmptyUserId_ShouldThrowException() {
        // Arrange
        Pageable pageable = PageRequest.of(0, 10);

        // Act & Assert
        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, () -> {
            locationService.getUserLocations("", pageable);
        });

        assertEquals("User ID cannot be null or empty", exception.getMessage());
        verify(locationRepository, never()).findByUserIdOrderByTimestampDesc(anyString(), any(Pageable.class));
    }

    @Test
    void getUserLocations_WithPageable_WithWhitespaceUserId_ShouldThrowException() {
        // Arrange
        Pageable pageable = PageRequest.of(0, 10);

        // Act & Assert
        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, () -> {
            locationService.getUserLocations("   ", pageable);
        });

        assertEquals("User ID cannot be null or empty", exception.getMessage());
        verify(locationRepository, never()).findByUserIdOrderByTimestampDesc(anyString(), any(Pageable.class));
    }

    @Test
    void getUserLocations_WithPageable_WithNoLocations_ShouldReturnEmptyPage() {
        // Arrange
        Pageable pageable = PageRequest.of(0, 10);
        Page<Location> expectedPage = new PageImpl<>(Collections.emptyList(), pageable, 0);
        when(locationRepository.findByUserIdOrderByTimestampDesc(testUserId, pageable)).thenReturn(expectedPage);

        // Act
        Page<Location> result = locationService.getUserLocations(testUserId, pageable);

        // Assert
        assertNotNull(result);
        assertTrue(result.getContent().isEmpty());
        assertEquals(0, result.getTotalElements());
        assertEquals(0, result.getTotalPages());
        verify(locationRepository).findByUserIdOrderByTimestampDesc(testUserId, pageable);
    }

    @Test
    void getUserLocations_WithPageable_WithMultiplePages_ShouldReturnCorrectPage() {
        // Arrange
        Pageable pageable = PageRequest.of(1, 5); // Second page, 5 items per page
        List<Location> locations = Arrays.asList(testLocation);
        Page<Location> expectedPage = new PageImpl<>(locations, pageable, 10); // 10 total elements
        when(locationRepository.findByUserIdOrderByTimestampDesc(testUserId, pageable)).thenReturn(expectedPage);

        // Act
        Page<Location> result = locationService.getUserLocations(testUserId, pageable);

        // Assert
        assertNotNull(result);
        assertEquals(1, result.getContent().size());
        assertEquals(10, result.getTotalElements());
        assertEquals(2, result.getTotalPages());
        assertEquals(1, result.getNumber()); // Current page number
        verify(locationRepository).findByUserIdOrderByTimestampDesc(testUserId, pageable);
    }

    @Test
    void getUserLocations_WithPageable_WithNullPageable_ShouldThrowException() {
        // Act & Assert
        assertThrows(NullPointerException.class, () -> {
            locationService.getUserLocations(testUserId, null);
        });
    }

    @Test
    void saveLocation_WithExtremeCoordinates_ShouldSave() {
        // Arrange
        when(locationRepository.save(any(Location.class))).thenReturn(testLocation);

        // Act
        Location result = locationService.saveLocation(testUserId, 90.0, 180.0, testTimestamp);

        // Assert
        assertNotNull(result);
        verify(locationRepository).save(any(Location.class));
    }

    @Test
    void saveLocation_WithVeryLongUserId_ShouldSave() {
        // Arrange
        String veryLongUserId = "very-long-firebase-uid-that-exceeds-normal-length-but-still-valid";
        when(locationRepository.save(any(Location.class))).thenReturn(testLocation);

        // Act
        Location result = locationService.saveLocation(veryLongUserId, testLatitude, testLongitude, testTimestamp);

        // Assert
        assertNotNull(result);
        verify(locationRepository).save(any(Location.class));
    }
}
