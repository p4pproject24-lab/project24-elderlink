package com.example.ai_companion.repository;

import com.example.ai_companion.model.Connection;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ConnectionRepository extends MongoRepository<Connection, String> {
    Connection findByCaregiverIdAndElderlyId(String caregiverId, String elderlyId);
    List<Connection> findByElderlyIdAndStatus(String elderlyId, String status);
    List<Connection> findByCaregiverIdAndStatus(String caregiverId, String status);
} 