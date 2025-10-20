package com.example.ai_companion.repository;

import com.example.ai_companion.model.Location;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LocationRepository extends MongoRepository<Location, String> {
    List<Location> findByUserIdOrderByTimestampDesc(String userId);
    Page<Location> findByUserIdOrderByTimestampDesc(String userId, Pageable pageable);
}
