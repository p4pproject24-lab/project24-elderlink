package com.example.ai_companion.repository;

import com.example.ai_companion.model.Reminder;

import org.springframework.data.domain.Page;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import org.springframework.data.domain.Pageable;


import java.time.Instant;
import java.util.List;

@Repository
public interface ReminderRepository extends MongoRepository<Reminder, String> {
    List<Reminder> findTop10ByUserIdAndTimestampGreaterThanOrderByTimestampAsc(String userId, Instant now);
    Page<Reminder> findByUserId(String userId, Pageable pageable);
}