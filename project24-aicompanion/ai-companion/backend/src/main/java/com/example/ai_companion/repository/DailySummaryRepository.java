package com.example.ai_companion.repository;

import com.example.ai_companion.model.DailySummary;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface DailySummaryRepository extends MongoRepository<DailySummary, String> {
    
    Optional<DailySummary> findByUserIdAndDate(String userId, LocalDate date);
    
    List<DailySummary> findByUserIdOrderByDateDesc(String userId);
    
    @Query("{'userId': ?0, 'date': {$gte: ?1, $lte: ?2}}")
    List<DailySummary> findByUserIdAndDateBetween(String userId, LocalDate startDate, LocalDate endDate);
    
    boolean existsByUserIdAndDate(String userId, LocalDate date);
    
    void deleteByUserIdAndDate(String userId, LocalDate date);
} 