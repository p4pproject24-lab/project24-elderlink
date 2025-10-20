package com.example.ai_companion.service;

import com.example.ai_companion.model.Connection;
import com.example.ai_companion.model.User;
import com.example.ai_companion.repository.ConnectionRepository;
import com.example.ai_companion.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class ConnectionService {
    @Autowired
    private ConnectionRepository connectionRepository;
    @Autowired
    private UserRepository userRepository;

    public Connection sendConnectionRequest(String caregiverId, String elderlyId) {
        // Prevent duplicate requests
        Connection existing = connectionRepository.findByCaregiverIdAndElderlyId(caregiverId, elderlyId);
        if (existing != null && !"rejected".equals(existing.getStatus())) {
            return existing;
        }
        Connection connection = new Connection();
        connection.setCaregiverId(caregiverId);
        connection.setElderlyId(elderlyId);
        connection.setStatus("pending");
        connection.setCreatedAt(LocalDateTime.now());
        return connectionRepository.save(connection);
    }

    public List<Connection> getPendingRequestsForElderly(String elderlyId) {
        return connectionRepository.findByElderlyIdAndStatus(elderlyId, "pending");
    }

    public Connection approveConnection(String connectionId) {
        Optional<Connection> opt = connectionRepository.findById(connectionId);
        if (opt.isPresent()) {
            Connection connection = opt.get();
            connection.setStatus("approved");
            connection.setConfirmedAt(LocalDateTime.now());
            
            // Update User models to reflect the approved connection
            updateUserConnections(connection.getCaregiverId(), connection.getElderlyId(), true);
            
            return connectionRepository.save(connection);
        }
        return null;
    }

    public Connection rejectConnection(String connectionId) {
        Optional<Connection> opt = connectionRepository.findById(connectionId);
        if (opt.isPresent()) {
            Connection connection = opt.get();
            connection.setStatus("rejected");
            connection.setConfirmedAt(LocalDateTime.now());
            
            // Update User models to reflect the rejected connection
            updateUserConnections(connection.getCaregiverId(), connection.getElderlyId(), false);
            
            return connectionRepository.save(connection);
        }
        return null;
    }

    private void updateUserConnections(String caregiverId, String elderlyId, boolean isApproved) {
        try {
            // Update caregiver's elderlyUserIds list
            User caregiver = userRepository.findByFirebaseUid(caregiverId);
            if (caregiver != null) {
                if (isApproved) {
                    if (!caregiver.getElderlyUserIds().contains(elderlyId)) {
                        caregiver.getElderlyUserIds().add(elderlyId);
                    }
                } else {
                    caregiver.getElderlyUserIds().remove(elderlyId);
                }
                userRepository.save(caregiver);
                System.out.println("[ConnectionService] Updated caregiver " + caregiverId + " elderlyUserIds: " + caregiver.getElderlyUserIds());
            }

            // Update elderly's caregiverIds list
            User elderly = userRepository.findByFirebaseUid(elderlyId);
            if (elderly != null) {
                if (isApproved) {
                    if (!elderly.getCaregiverIds().contains(caregiverId)) {
                        elderly.getCaregiverIds().add(caregiverId);
                    }
                } else {
                    elderly.getCaregiverIds().remove(caregiverId);
                }
                userRepository.save(elderly);
                System.out.println("[ConnectionService] Updated elderly " + elderlyId + " caregiverIds: " + elderly.getCaregiverIds());
            }
        } catch (Exception e) {
            System.err.println("[ConnectionService] Error updating user connections: " + e.getMessage());
        }
    }

    public List<User> getConnectedElderlyForCaregiver(String caregiverId) {
        List<Connection> approved = connectionRepository.findByCaregiverIdAndStatus(caregiverId, "approved");
        List<String> elderlyIds = approved.stream().map(Connection::getElderlyId).collect(Collectors.toList());
        return elderlyIds.stream()
            .map(userRepository::findByFirebaseUid)
            .filter(user -> user != null)
            .collect(Collectors.toList());
    }

    public List<User> getConnectedCaregiversForElderly(String elderlyId) {
        System.out.println("[DEBUG] getConnectedCaregiversForElderly called with elderlyId: " + elderlyId);
        List<Connection> approved = connectionRepository.findByElderlyIdAndStatus(elderlyId, "approved");
        System.out.println("[DEBUG] Connections found: " + approved.size());
        List<String> caregiverIds = approved.stream().map(Connection::getCaregiverId).collect(Collectors.toList());
        System.out.println("[DEBUG] Caregiver IDs: " + caregiverIds);
        List<User> caregivers = caregiverIds.stream()
            .map(userRepository::findByFirebaseUid)
            .filter(user -> user != null)
            .collect(Collectors.toList());
        System.out.println("[DEBUG] Users returned: " + caregivers.size());
        return caregivers;
    }

    public boolean removeConnection(String caregiverId, String elderlyId) {
        Connection connection = connectionRepository.findByCaregiverIdAndElderlyId(caregiverId, elderlyId);
        if (connection != null) {
            connectionRepository.delete(connection);
            
            // Update User models to reflect the removed connection
            updateUserConnections(caregiverId, elderlyId, false);
            
            return true;
        }
        return false;
    }

    public User getUserById(String firebaseUid) {
        return userRepository.findByFirebaseUid(firebaseUid);
    }
} 