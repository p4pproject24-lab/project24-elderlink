package com.example.ai_companion.service;

import com.example.ai_companion.model.Location;
import com.example.ai_companion.repository.LocationRepository;
import com.example.ai_companion.utils.logger;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;

@Service
public class LocationService {
    @Autowired
    private LocationRepository locationRepository;

    public Location saveLocation(String userId, double latitude, double longitude, Instant timestamp) {
        // Validate that userId is not null and looks like a Firebase UID (typically 28 characters)
        if (userId == null || userId.trim().isEmpty()) {
            throw new IllegalArgumentException("User ID cannot be null or empty");
        }
        
        // Firebase UIDs are typically 28 characters long
        if (userId.length() < 20) {
            logger.logToFile(userId, "Warning: User ID seems too short for Firebase UID: " + userId);
        }
        
        logger.logToFile(userId, "LocationService: Saving location for Firebase UID: " + userId);
        
        Location location = new Location(userId, latitude, longitude, timestamp);
        Location saved = locationRepository.save(location);
        
        logger.logToFile(userId, "LocationService: Successfully saved location with ID: " + saved.getId());
        return saved;
    }

    public List<Location> getUserLocations(String userId) {
        if (userId == null || userId.trim().isEmpty()) {
            throw new IllegalArgumentException("User ID cannot be null or empty");
        }
        
        logger.logToFile(userId, "LocationService: Fetching all locations for Firebase UID: " + userId);
        
        List<Location> locations = locationRepository.findByUserIdOrderByTimestampDesc(userId);
        logger.logToFile(userId, "LocationService: Found " + locations.size() + " locations for Firebase UID: " + userId);
        
        return locations;
    }

    public Page<Location> getUserLocations(String userId, Pageable pageable) {
        if (userId == null || userId.trim().isEmpty()) {
            throw new IllegalArgumentException("User ID cannot be null or empty");
        }
        
        logger.logToFile(userId, "LocationService: Fetching paginated locations for Firebase UID: " + userId + 
                      ", page: " + pageable.getPageNumber() + ", size: " + pageable.getPageSize());
        
        Page<Location> locationPage = locationRepository.findByUserIdOrderByTimestampDesc(userId, pageable);
        logger.logToFile(userId, "LocationService: Found " + locationPage.getContent().size() + 
                      " locations (page " + locationPage.getNumber() + " of " + locationPage.getTotalPages() + ")");
        
        return locationPage;
    }
}
