package com.example.ai_companion.service;

import com.example.ai_companion.model.User;
import com.example.ai_companion.repository.UserRepository;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseToken;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
public class CustomUserDetailsService implements UserDetailsService {

    @Autowired
    private UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String firebaseUid) throws UsernameNotFoundException {
        User user = userRepository.findByFirebaseUid(firebaseUid);
        if (user != null) {
            return user;
        }
        throw new UsernameNotFoundException("User not found with firebaseUid: " + firebaseUid);
    }

    // Add a method to create or update user from FirebaseToken
    public User createOrUpdateUserFromFirebaseToken(FirebaseToken token) {
        String firebaseUid = token.getUid();
        String email = token.getEmail();
        String phone = null;
        if (token.getClaims() != null && token.getClaims().get("phone_number") != null) {
            phone = String.valueOf(token.getClaims().get("phone_number"));
        }
        String name = token.getName();
        String picture = token.getPicture();

        // Try to find by UID
        User user = userRepository.findByFirebaseUid(firebaseUid);
        if (user != null) {
            return user;
        }
        // Try to find by email
        if (email != null) {
            user = userRepository.findByEmail(email);
            if (user != null) {
                user.setFirebaseUid(firebaseUid);
                userRepository.save(user);
                return user;
            }
        }
        // Try to find by phone
        if (phone != null) {
            user = userRepository.findByPhoneNumber(phone);
            if (user != null) {
                user.setFirebaseUid(firebaseUid);
                userRepository.save(user);
                return user;
            }
        }
        // Create new user
        user = new User();
        user.setFirebaseUid(firebaseUid);
        user.setEmail(email);
        user.setPhoneNumber(phone);
        user.setFullName(name);
        user.setProfileImageUrl(picture);
        user.setRole(User.Role.NONE);
        userRepository.save(user);
        return user;
    }
}
