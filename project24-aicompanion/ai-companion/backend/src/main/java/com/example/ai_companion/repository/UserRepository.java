package com.example.ai_companion.repository;

import com.example.ai_companion.model.User;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface UserRepository extends MongoRepository<User, String> {
    User findByUsername(String username);
    User findByEmail(String email);
    User findByPhoneNumber(String phoneNumber);
    User findByFirebaseUid(String firebaseUid);
}
