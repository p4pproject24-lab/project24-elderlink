package com.example.ai_companion.controller;

import com.example.ai_companion.service.WeatherService;
import com.example.ai_companion.utils.logger;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Controller for weather-related endpoints.
 */
@RestController
@RequestMapping("/weather")
@CrossOrigin(origins = "*")
public class WeatherController {

    @Autowired
    private WeatherService weatherService;

    /**
     * Gets weather data for coordinates.
     */
    @GetMapping("/info")
    public ResponseEntity<Map<String, Object>> getWeatherData(
            @RequestParam double latitude,
            @RequestParam double longitude) {
        
        logger.logToFile("weather_controller", "Weather request received - Latitude: " + latitude + ", Longitude: " + longitude);
        
        Map<String, Object> data = weatherService.getWeatherData(latitude, longitude);
        
        logger.logToFile("weather_controller", "Weather response sent - Success: " + data.get("success") + 
            (data.containsKey("temperature") ? ", Temp: " + data.get("temperature") + "°F" : ""));
        
        return ResponseEntity.ok(data);
    }
} 