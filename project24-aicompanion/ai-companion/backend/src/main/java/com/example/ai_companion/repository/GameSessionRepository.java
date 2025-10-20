package com.example.ai_companion.repository;

import com.example.ai_companion.model.GameSession;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository interface for GameSession entities.
 */
@Repository
public interface GameSessionRepository extends MongoRepository<GameSession, String> {
    
    List<GameSession> findByUserIdOrderByLastActivityAtDesc(String userId);
    
    Page<GameSession> findByUserIdOrderByLastActivityAtDesc(String userId, Pageable pageable);
    
    List<GameSession> findByUserIdAndIsActiveTrueOrderByLastActivityAtDesc(String userId);
} 