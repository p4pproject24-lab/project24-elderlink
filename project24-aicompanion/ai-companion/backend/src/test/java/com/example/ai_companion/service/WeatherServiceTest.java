package com.example.ai_companion.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class WeatherServiceTest {

    @InjectMocks
    private WeatherService weatherService;

    private double testLatitude;
    private double testLongitude;

    @BeforeEach
    void setUp() {
        testLatitude = 40.7128;
        testLongitude = -74.0060;
    }

    @Test
    void getWeatherData_WithNullApiKey_ShouldReturnFallbackData() {
        // Arrange
        ReflectionTestUtils.setField(weatherService, "weatherApiKey", null);

        // Act
        Map<String, Object> result = weatherService.getWeatherData(testLatitude, testLongitude);

        // Assert
        assertNotNull(result);
        assertTrue(result.containsKey("weather"));
        assertTrue(result.containsKey("location"));
        
        @SuppressWarnings("unchecked")
        Map<String, Object> weather = (Map<String, Object>) result.get("weather");
        assertNotNull(weather);
        assertEquals(22.2, weather.get("temperature"));
        assertEquals(23.3, weather.get("feelsLike"));
        assertEquals(65, weather.get("humidity"));
        assertEquals("Clear", weather.get("condition"));
        assertEquals("clear sky", weather.get("description"));
        assertEquals("01d", weather.get("icon"));
        assertEquals(12.9, weather.get("windSpeed"));
        assertFalse((Boolean) weather.get("success"));
        assertEquals("Using fallback weather data", weather.get("message"));
        
        @SuppressWarnings("unchecked")
        Map<String, Object> location = (Map<String, Object>) result.get("location");
        assertNotNull(location);
        assertTrue(location.isEmpty());
    }

    @Test
    void getWeatherData_WithEmptyApiKey_ShouldReturnFallbackData() {
        // Arrange
        ReflectionTestUtils.setField(weatherService, "weatherApiKey", "");

        // Act
        Map<String, Object> result = weatherService.getWeatherData(testLatitude, testLongitude);

        // Assert
        assertNotNull(result);
        assertTrue(result.containsKey("weather"));
        assertTrue(result.containsKey("location"));
        
        @SuppressWarnings("unchecked")
        Map<String, Object> weather = (Map<String, Object>) result.get("weather");
        assertNotNull(weather);
        assertFalse((Boolean) weather.get("success"));
        assertEquals("Using fallback weather data", weather.get("message"));
    }

    @Test
    void getWeatherData_WithDefaultApiKey_ShouldReturnFallbackData() {
        // Arrange
        ReflectionTestUtils.setField(weatherService, "weatherApiKey", "YOUR_OPENWEATHERMAP_API_KEY");

        // Act
        Map<String, Object> result = weatherService.getWeatherData(testLatitude, testLongitude);

        // Assert
        assertNotNull(result);
        assertTrue(result.containsKey("weather"));
        assertTrue(result.containsKey("location"));
        
        @SuppressWarnings("unchecked")
        Map<String, Object> weather = (Map<String, Object>) result.get("weather");
        assertNotNull(weather);
        assertFalse((Boolean) weather.get("success"));
        assertEquals("Using fallback weather data", weather.get("message"));
    }

    @Test
    void getWeatherData_WithWeatherApiKey_ShouldReturnFallbackData() {
        // Arrange
        ReflectionTestUtils.setField(weatherService, "weatherApiKey", "YOUR_WEATHERAPI_KEY");

        // Act
        Map<String, Object> result = weatherService.getWeatherData(testLatitude, testLongitude);

        // Assert
        assertNotNull(result);
        assertTrue(result.containsKey("weather"));
        assertTrue(result.containsKey("location"));
        
        @SuppressWarnings("unchecked")
        Map<String, Object> weather = (Map<String, Object>) result.get("weather");
        assertNotNull(weather);
        assertFalse((Boolean) weather.get("success"));
        assertEquals("Using fallback weather data", weather.get("message"));
    }

    @Test
    void getWeatherData_WithValidApiKey_ShouldAttemptApiCall() {
        // Arrange
        ReflectionTestUtils.setField(weatherService, "weatherApiKey", "valid-api-key");

        // Act
        Map<String, Object> result = weatherService.getWeatherData(testLatitude, testLongitude);

        // Assert
        assertNotNull(result);
        assertTrue(result.containsKey("weather"));
        assertTrue(result.containsKey("location"));
        
        @SuppressWarnings("unchecked")
        Map<String, Object> weather = (Map<String, Object>) result.get("weather");
        assertNotNull(weather);
        // Since we don't have a real API key, it should return fallback data
        assertFalse((Boolean) weather.get("success"));
        assertEquals("Using fallback weather data", weather.get("message"));
    }

    @Test
    void getWeatherData_WithDifferentCoordinates_ShouldReturnFallbackData() {
        // Arrange
        ReflectionTestUtils.setField(weatherService, "weatherApiKey", "test-key");
        double latitude = 51.5074;
        double longitude = -0.1278;

        // Act
        Map<String, Object> result = weatherService.getWeatherData(latitude, longitude);

        // Assert
        assertNotNull(result);
        assertTrue(result.containsKey("weather"));
        assertTrue(result.containsKey("location"));
        
        @SuppressWarnings("unchecked")
        Map<String, Object> weather = (Map<String, Object>) result.get("weather");
        assertNotNull(weather);
        assertFalse((Boolean) weather.get("success"));
        assertEquals("Using fallback weather data", weather.get("message"));
    }

    @Test
    void getWeatherData_WithZeroCoordinates_ShouldReturnFallbackData() {
        // Arrange
        ReflectionTestUtils.setField(weatherService, "weatherApiKey", "test-key");

        // Act
        Map<String, Object> result = weatherService.getWeatherData(0.0, 0.0);

        // Assert
        assertNotNull(result);
        assertTrue(result.containsKey("weather"));
        assertTrue(result.containsKey("location"));
        
        @SuppressWarnings("unchecked")
        Map<String, Object> weather = (Map<String, Object>) result.get("weather");
        assertNotNull(weather);
        assertFalse((Boolean) weather.get("success"));
        assertEquals("Using fallback weather data", weather.get("message"));
    }

    @Test
    void getWeatherData_WithNegativeCoordinates_ShouldReturnFallbackData() {
        // Arrange
        ReflectionTestUtils.setField(weatherService, "weatherApiKey", "test-key");

        // Act
        Map<String, Object> result = weatherService.getWeatherData(-90.0, -180.0);

        // Assert
        assertNotNull(result);
        assertTrue(result.containsKey("weather"));
        assertTrue(result.containsKey("location"));
        
        @SuppressWarnings("unchecked")
        Map<String, Object> weather = (Map<String, Object>) result.get("weather");
        assertNotNull(weather);
        assertFalse((Boolean) weather.get("success"));
        assertEquals("Using fallback weather data", weather.get("message"));
    }

    @Test
    void getWeatherData_WithExtremeCoordinates_ShouldReturnFallbackData() {
        // Arrange
        ReflectionTestUtils.setField(weatherService, "weatherApiKey", "test-key");

        // Act
        Map<String, Object> result = weatherService.getWeatherData(90.0, 180.0);

        // Assert
        assertNotNull(result);
        assertTrue(result.containsKey("weather"));
        assertTrue(result.containsKey("location"));
        
        @SuppressWarnings("unchecked")
        Map<String, Object> weather = (Map<String, Object>) result.get("weather");
        assertNotNull(weather);
        assertFalse((Boolean) weather.get("success"));
        assertEquals("Using fallback weather data", weather.get("message"));
    }

    @Test
    void getWeatherData_WithFallbackData_ShouldHaveCorrectStructure() {
        // Arrange
        ReflectionTestUtils.setField(weatherService, "weatherApiKey", null);

        // Act
        Map<String, Object> result = weatherService.getWeatherData(testLatitude, testLongitude);

        // Assert
        assertNotNull(result);
        assertTrue(result.containsKey("weather"));
        assertTrue(result.containsKey("location"));
        
        @SuppressWarnings("unchecked")
        Map<String, Object> weather = (Map<String, Object>) result.get("weather");
        assertNotNull(weather);
        
        // Check all required fields are present
        assertTrue(weather.containsKey("temperature"));
        assertTrue(weather.containsKey("feelsLike"));
        assertTrue(weather.containsKey("humidity"));
        assertTrue(weather.containsKey("condition"));
        assertTrue(weather.containsKey("description"));
        assertTrue(weather.containsKey("icon"));
        assertTrue(weather.containsKey("windSpeed"));
        assertTrue(weather.containsKey("success"));
        assertTrue(weather.containsKey("message"));
        
        // Check data types
        assertTrue(weather.get("temperature") instanceof Double);
        assertTrue(weather.get("feelsLike") instanceof Double);
        assertTrue(weather.get("humidity") instanceof Integer);
        assertTrue(weather.get("condition") instanceof String);
        assertTrue(weather.get("description") instanceof String);
        assertTrue(weather.get("icon") instanceof String);
        assertTrue(weather.get("windSpeed") instanceof Double);
        assertTrue(weather.get("success") instanceof Boolean);
        assertTrue(weather.get("message") instanceof String);
    }

    @Test
    void getWeatherData_WithSuccessfulApiResponse_ShouldReturnWeatherData() throws Exception {
        // Arrange
        ReflectionTestUtils.setField(weatherService, "weatherApiKey", "valid-api-key");
        
        // Mock the API response
        String mockApiResponse = """
            {
                "current": {
                    "temp_f": 72.0,
                    "feelslike_f": 74.0,
                    "humidity": 65,
                    "condition": {
                        "text": "Sunny",
                        "icon": "//cdn.weatherapi.com/weather/64x64/day/113.png"
                    },
                    "wind_mph": 8.0,
                    "wind_dir": "NW",
                    "pressure_in": 30.0,
                    "cloud": 10,
                    "uv": 6.0,
                    "is_day": 1,
                    "last_updated": "2024-01-15 12:00"
                },
                "location": {
                    "name": "New York",
                    "region": "NY",
                    "country": "USA",
                    "lat": 40.7128,
                    "lon": -74.0060,
                    "tz_id": "America/New_York",
                    "localtime": "2024-01-15 12:00"
                }
            }
            """;
        
        // Mock RestTemplate
        RestTemplate mockRestTemplate = mock(RestTemplate.class);
        when(mockRestTemplate.getForObject(anyString(), eq(String.class)))
            .thenReturn(mockApiResponse);
        ReflectionTestUtils.setField(weatherService, "restTemplate", mockRestTemplate);
        
        // Mock ObjectMapper
        ObjectMapper mockObjectMapper = mock(ObjectMapper.class);
        JsonNode mockJsonNode = mock(JsonNode.class);
        JsonNode mockCurrent = mock(JsonNode.class);
        JsonNode mockCondition = mock(JsonNode.class);
        JsonNode mockLocation = mock(JsonNode.class);
        
        when(mockObjectMapper.readTree(mockApiResponse)).thenReturn(mockJsonNode);
        when(mockJsonNode.has("current")).thenReturn(true);
        when(mockJsonNode.has("location")).thenReturn(true);
        when(mockJsonNode.get("current")).thenReturn(mockCurrent);
        when(mockJsonNode.get("location")).thenReturn(mockLocation);
        
        // Mock current weather data
        when(mockCurrent.get("temp_f")).thenReturn(mock(JsonNode.class));
        when(mockCurrent.get("temp_f").asDouble()).thenReturn(72.0);
        when(mockCurrent.get("feelslike_f")).thenReturn(mock(JsonNode.class));
        when(mockCurrent.get("feelslike_f").asDouble()).thenReturn(74.0);
        when(mockCurrent.get("humidity")).thenReturn(mock(JsonNode.class));
        when(mockCurrent.get("humidity").asInt()).thenReturn(65);
        when(mockCurrent.get("wind_mph")).thenReturn(mock(JsonNode.class));
        when(mockCurrent.get("wind_mph").asDouble()).thenReturn(8.0);
        when(mockCurrent.get("wind_dir")).thenReturn(mock(JsonNode.class));
        when(mockCurrent.get("wind_dir").asText()).thenReturn("NW");
        when(mockCurrent.get("pressure_in")).thenReturn(mock(JsonNode.class));
        when(mockCurrent.get("pressure_in").asDouble()).thenReturn(30.0);
        when(mockCurrent.get("cloud")).thenReturn(mock(JsonNode.class));
        when(mockCurrent.get("cloud").asInt()).thenReturn(10);
        when(mockCurrent.get("uv")).thenReturn(mock(JsonNode.class));
        when(mockCurrent.get("uv").asDouble()).thenReturn(6.0);
        when(mockCurrent.get("is_day")).thenReturn(mock(JsonNode.class));
        when(mockCurrent.get("is_day").asInt()).thenReturn(1);
        when(mockCurrent.get("last_updated")).thenReturn(mock(JsonNode.class));
        when(mockCurrent.get("last_updated").asText()).thenReturn("2024-01-15 12:00");
        
        // Mock condition data
        when(mockCurrent.get("condition")).thenReturn(mockCondition);
        when(mockCondition.get("text")).thenReturn(mock(JsonNode.class));
        when(mockCondition.get("text").asText()).thenReturn("Sunny");
        when(mockCondition.get("icon")).thenReturn(mock(JsonNode.class));
        when(mockCondition.get("icon").asText()).thenReturn("//cdn.weatherapi.com/weather/64x64/day/113.png");
        
        // Mock location data
        when(mockLocation.get("name")).thenReturn(mock(JsonNode.class));
        when(mockLocation.get("name").asText()).thenReturn("New York");
        when(mockLocation.get("region")).thenReturn(mock(JsonNode.class));
        when(mockLocation.get("region").asText()).thenReturn("NY");
        when(mockLocation.get("country")).thenReturn(mock(JsonNode.class));
        when(mockLocation.get("country").asText()).thenReturn("USA");
        when(mockLocation.get("lat")).thenReturn(mock(JsonNode.class));
        when(mockLocation.get("lat").asDouble()).thenReturn(40.7128);
        when(mockLocation.get("lon")).thenReturn(mock(JsonNode.class));
        when(mockLocation.get("lon").asDouble()).thenReturn(-74.0060);
        when(mockLocation.get("tz_id")).thenReturn(mock(JsonNode.class));
        when(mockLocation.get("tz_id").asText()).thenReturn("America/New_York");
        when(mockLocation.get("localtime")).thenReturn(mock(JsonNode.class));
        when(mockLocation.get("localtime").asText()).thenReturn("2024-01-15 12:00");
        
        ReflectionTestUtils.setField(weatherService, "objectMapper", mockObjectMapper);

        // Act
        Map<String, Object> result = weatherService.getWeatherData(testLatitude, testLongitude);

        // Assert
        assertNotNull(result);
        assertTrue(result.containsKey("weather"));
        assertTrue(result.containsKey("location"));
        
        @SuppressWarnings("unchecked")
        Map<String, Object> weather = (Map<String, Object>) result.get("weather");
        assertNotNull(weather);
        assertEquals(22.2, weather.get("temperature")); // 72°F = 22.2°C
        assertEquals(23.3, weather.get("feelsLike")); // 74°F = 23.3°C
        assertEquals(65, weather.get("humidity"));
        assertEquals("Sunny", weather.get("condition"));
        assertEquals("Sunny", weather.get("description"));
        assertEquals("https://cdn.weatherapi.com/weather/64x64/day/113.png", weather.get("icon"));
        assertEquals(12.9, weather.get("windSpeed")); // 8 mph = 12.9 km/h
        assertEquals("NW", weather.get("windDir"));
        assertEquals(1016.0, weather.get("pressure")); // 30 in = 1016 hPa
        assertEquals(10, weather.get("cloud"));
        assertEquals(6.0, weather.get("uv"));
        assertEquals(1, weather.get("isDay"));
        assertEquals("2024-01-15 12:00", weather.get("lastUpdated"));
        assertEquals(true, weather.get("success"));
        
        @SuppressWarnings("unchecked")
        Map<String, Object> location = (Map<String, Object>) result.get("location");
        assertNotNull(location);
        assertEquals("New York", location.get("city"));
        assertEquals("NY", location.get("region"));
        assertEquals("USA", location.get("country"));
        assertEquals(40.7128, location.get("lat"));
        assertEquals(-74.0060, location.get("lon"));
        assertEquals("America/New_York", location.get("tz_id"));
        assertEquals("2024-01-15 12:00", location.get("localtime"));
    }
}