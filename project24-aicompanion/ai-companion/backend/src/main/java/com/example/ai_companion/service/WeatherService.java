package com.example.ai_companion.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.util.HashMap;
import java.util.Map;

/**
 * Service for fetching weather data from external APIs.
 */
@Service
public class WeatherService {

    @Value("${weather.api.key:}")
    private String weatherApiKey;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * Gets weather data for a specific location.
     */
    public Map<String, Object> getWeatherData(double latitude, double longitude) {
        Map<String, Object> result = new HashMap<>();
        Map<String, Object> weatherData = new HashMap<>();
        Map<String, Object> locationData = new HashMap<>();
        
        // Log API key status
        if (weatherApiKey == null || weatherApiKey.trim().isEmpty()) {
            result.put("weather", getFallbackWeatherData());
            result.put("location", new HashMap<>());
            return result;
        }
        
        if (weatherApiKey.equals("YOUR_OPENWEATHERMAP_API_KEY") || weatherApiKey.equals("YOUR_WEATHERAPI_KEY")) {
            result.put("weather", getFallbackWeatherData());
            result.put("location", new HashMap<>());
            return result;
        }
        
        
        try {
            String url = String.format(
                "http://api.weatherapi.com/v1/current.json?key=%s&q=%.6f,%.6f&aqi=no",
                weatherApiKey, latitude, longitude
            );
            
            String response = restTemplate.getForObject(url, String.class);
            
            if (response == null) {
                result.put("weather", getFallbackWeatherData());
                result.put("location", new HashMap<>());
                return result;
            }
            

            JsonNode jsonNode = objectMapper.readTree(response);

            if (jsonNode != null && jsonNode.has("current") && jsonNode.has("location")) {
                JsonNode current = jsonNode.get("current");
                JsonNode condition = current.get("condition");
                JsonNode location = jsonNode.get("location");

                // Weather data - Convert to metric units
                // Convert Fahrenheit to Celsius: (F - 32) * 5/9
                double tempF = current.get("temp_f").asDouble();
                double tempC = Math.round((tempF - 32) * 5.0 / 9.0 * 10.0) / 10.0; // Round to 1 decimal place
                weatherData.put("temperature", tempC);
                
                double feelsLikeF = current.get("feelslike_f").asDouble();
                double feelsLikeC = Math.round((feelsLikeF - 32) * 5.0 / 9.0 * 10.0) / 10.0;
                weatherData.put("feelsLike", feelsLikeC);
                
                weatherData.put("humidity", current.get("humidity").asInt());
                weatherData.put("condition", condition.get("text").asText());
                weatherData.put("description", condition.get("text").asText());
                // Ensure icon is a full URL
                String iconPath = condition.get("icon").asText();
                String iconUrl = iconPath.startsWith("http") ? iconPath : ("https:" + iconPath);
                weatherData.put("icon", iconUrl);
                
                // Convert mph to km/h: mph * 1.60934
                double windMph = current.get("wind_mph").asDouble();
                double windKph = Math.round(windMph * 1.60934 * 10.0) / 10.0;
                weatherData.put("windSpeed", windKph);
                weatherData.put("windDir", current.get("wind_dir").asText());
                
                // Convert inches to hPa: inches * 33.8639
                double pressureIn = current.get("pressure_in").asDouble();
                double pressureHpa = Math.round(pressureIn * 33.8639);
                weatherData.put("pressure", pressureHpa);
                
                weatherData.put("cloud", current.get("cloud").asInt());
                weatherData.put("uv", current.get("uv").asDouble());
                weatherData.put("isDay", current.get("is_day").asInt());
                weatherData.put("lastUpdated", current.get("last_updated").asText());
                weatherData.put("success", true);

                // Location data
                locationData.put("city", location.get("name").asText());
                locationData.put("region", location.get("region").asText());
                locationData.put("country", location.get("country").asText());
                locationData.put("lat", location.get("lat").asDouble());
                locationData.put("lon", location.get("lon").asDouble());
                locationData.put("tz_id", location.get("tz_id").asText());
                locationData.put("localtime", location.get("localtime").asText());

                result.put("weather", weatherData);
                result.put("location", locationData);
                return result;
            } else {
                result.put("weather", getFallbackWeatherData());
                result.put("location", new HashMap<>());
                return result;
            }

        } catch (Exception e) {
            result.put("weather", getFallbackWeatherData());
            result.put("location", new HashMap<>());
            return result;
        }
    }



    private Map<String, Object> getFallbackWeatherData() {
        Map<String, Object> fallback = new HashMap<>();
        // Convert fallback values to metric units
        // 72°F = 22.2°C, 74°F = 23.3°C, 8 mph = 12.9 km/h
        fallback.put("temperature", 22.2);
        fallback.put("feelsLike", 23.3);
        fallback.put("humidity", 65);
        fallback.put("condition", "Clear");
        fallback.put("description", "clear sky");
        fallback.put("icon", "01d");
        fallback.put("windSpeed", 12.9);
        fallback.put("success", false);
        fallback.put("message", "Using fallback weather data");
        return fallback;
    }
} 