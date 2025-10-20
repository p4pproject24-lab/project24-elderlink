package com.example.ai_companion.repository;

import com.example.ai_companion.model.Message;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface MessageRepository extends MongoRepository<Message, String> {
    List<Message> findByUserId(String userId);
    List<Message> findTop10ByUserIdOrderByTimestampDesc(String userId);  
    List<Message> findByUserId(String userId, Pageable pageable);

}
