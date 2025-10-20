package com.example.ai_companion.repository;

import com.example.ai_companion.model.GameMessage;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository interface for GameMessage entities.
 */
@Repository
public interface GameMessageRepository extends MongoRepository<GameMessage, String> {
    
    List<GameMessage> findByGameSessionIdOrderByTimestampAsc(String gameSessionId);
    
    Page<GameMessage> findByGameSessionIdOrderByTimestampDesc(String gameSessionId, Pageable pageable);
    
    List<GameMessage> findTop10ByGameSessionIdOrderByTimestampDesc(String gameSessionId);
} 