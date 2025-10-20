package com.example.ai_companion.controller;

import com.example.ai_companion.model.Connection;
import com.example.ai_companion.model.User;
import com.example.ai_companion.service.ConnectionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.springframework.messaging.simp.SimpMessagingTemplate;

@RestController
@RequestMapping("/connections")
public class ConnectionController {
    @Autowired
    private ConnectionService connectionService;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    // 1. Caregiver sends connection request (using elderlyId from QR)
    @PostMapping("/request")
    public ResponseEntity<?> sendConnectionRequest(@RequestParam String caregiverId, @RequestParam String elderlyId) {
        System.out.println("[ConnectionController] Received connection request: caregiverId=" + caregiverId + ", elderlyId=" + elderlyId);
        Connection connection = connectionService.sendConnectionRequest(caregiverId, elderlyId);
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("connection", connection);
        // Fetch caregiver profile
        User caregiver = connectionService.getUserById(caregiverId);
        String caregiverName = caregiver != null && caregiver.getFullName() != null ? caregiver.getFullName() : caregiverId;
        if (caregiverName == null) caregiverName = "";
        String caregiverProfilePictureUrl = caregiver != null && caregiver.getProfileImageUrl() != null ? caregiver.getProfileImageUrl() : "";
        // Prepare payload
        Map<String, Object> payload = Map.of(
            "type", "NEW_CONNECTION_REQUEST",
            "caregiverId", caregiverId,
            "caregiverName", caregiverName,
            "caregiverProfilePictureUrl", caregiverProfilePictureUrl,
            "elderlyId", elderlyId,
            "connectionId", connection.getId(),
            "status", connection.getStatus(),
            "createdAt", connection.getCreatedAt()
        );
        String topic = "/topic/elderly-" + elderlyId;
        System.out.println("[WebSocket] Sending to " + topic + ": " + payload);
        messagingTemplate.convertAndSend(topic, payload);
        return ResponseEntity.ok(response);
    }

    // 2. Elderly fetches pending requests
    @GetMapping("/pending")
    public ResponseEntity<?> getPendingRequestsForElderly(@RequestParam String elderlyId) {
        List<Connection> pending = connectionService.getPendingRequestsForElderly(elderlyId);
        // For each pending connection, fetch caregiver profile info
        List<Map<String, Object>> result = pending.stream().map(conn -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", conn.getId());
            map.put("status", conn.getStatus());
            map.put("createdAt", conn.getCreatedAt());
            map.put("caregiverId", conn.getCaregiverId());
            // Fetch caregiver profile
            User caregiver = connectionService.getUserById(conn.getCaregiverId());
            if (caregiver != null) {
                map.put("caregiverUsername", caregiver.getUsername());
                map.put("caregiverEmail", caregiver.getEmail());
                map.put("caregiverFullName", caregiver.getFullName());
                map.put("caregiverProfileImageUrl", caregiver.getProfileImageUrl());
            }
            return map;
        }).toList();
        return ResponseEntity.ok(result);
    }

    // 3. Elderly approves a request
    @PostMapping("/approve")
    public ResponseEntity<?> approveConnection(@RequestParam String connectionId) {
        System.out.println("[ConnectionController] Approve connection: connectionId=" + connectionId);
        Connection connection = connectionService.approveConnection(connectionId);
        Map<String, Object> response = new HashMap<>();
        response.put("success", connection != null);
        response.put("connection", connection);
        if (connection != null) {
            // Send WebSocket notification to caregiver on approval (public topic)
            String topic = "/topic/caregiver-" + connection.getCaregiverId();
            Map<String, Object> payload = Map.of(
                "type", "CONNECTION_APPROVED",
                "elderlyId", connection.getElderlyId(),
                "connectionId", connection.getId(),
                "status", connection.getStatus(),
                "confirmedAt", connection.getConfirmedAt()
            );
            System.out.println("[WebSocket] Sending to " + topic + ": " + payload);
            messagingTemplate.convertAndSend(topic, payload);
        }
        return ResponseEntity.ok(response);
    }

    // 4. Elderly rejects a request
    @PostMapping("/reject")
    public ResponseEntity<?> rejectConnection(@RequestParam String connectionId) {
        System.out.println("[ConnectionController] Reject connection: connectionId=" + connectionId);
        Connection connection = connectionService.rejectConnection(connectionId);
        Map<String, Object> response = new HashMap<>();
        response.put("success", connection != null);
        response.put("connection", connection);
        if (connection != null) {
            // Send WebSocket notification to caregiver on rejection
            System.out.println("[WebSocket] Sending rejection to user: " + connection.getCaregiverId());
            messagingTemplate.convertAndSendToUser(
                connection.getCaregiverId(),
                "/queue/connection-approvals",
                Map.of(
                    "type", "CONNECTION_REJECTED",
                    "elderlyId", connection.getElderlyId(),
                    "connectionId", connection.getId(),
                    "status", connection.getStatus(),
                    "confirmedAt", connection.getConfirmedAt()
                )
            );
        }
        return ResponseEntity.ok(response);
    }

    // 5. Caregiver fetches all connected elderly users (with profile info)
    @GetMapping("/elderly-list")
    public ResponseEntity<?> getConnectedElderlyForCaregiver(@RequestParam String caregiverId) {
        System.out.println("[ConnectionController] getConnectedElderlyForCaregiver called with caregiverId: " + caregiverId);
        List<User> elderlyList = connectionService.getConnectedElderlyForCaregiver(caregiverId);
        System.out.println("[ConnectionController] Returning " + elderlyList.size() + " elderly users for caregiver " + caregiverId);
        for (User elderly : elderlyList) {
            System.out.println("[ConnectionController] Elderly: id=" + elderly.getId() + ", firebaseUid=" + elderly.getFirebaseUid() + ", fullName=" + elderly.getFullName());
        }
        return ResponseEntity.ok(elderlyList);
    }

    // 6. Elderly fetches all connected caregivers (with profile info)
    @GetMapping("/caregiver-list")
    public ResponseEntity<?> getConnectedCaregiversForElderly(@RequestParam String elderlyId) {
        System.out.println("[ConnectionController] getConnectedCaregiversForElderly called with elderlyId: " + elderlyId);
        List<User> caregiverList = connectionService.getConnectedCaregiversForElderly(elderlyId);
        System.out.println("[ConnectionController] Returning " + caregiverList.size() + " caregivers for elderly " + elderlyId);
        for (User caregiver : caregiverList) {
            System.out.println("[ConnectionController] Caregiver: id=" + caregiver.getId() + ", firebaseUid=" + caregiver.getFirebaseUid() + ", fullName=" + caregiver.getFullName());
        }
        return ResponseEntity.ok(caregiverList);
    }

    // 7. Unsync (remove) a connection between caregiver and elderly
    @DeleteMapping("/unsync")
    public ResponseEntity<?> unsyncConnection(@RequestParam String caregiverId, @RequestParam String elderlyId) {
        boolean removed = connectionService.removeConnection(caregiverId, elderlyId);
        if (removed) {
            return ResponseEntity.ok(Map.of("success", true));
        } else {
            return ResponseEntity.status(404).body(Map.of("success", false, "error", "Connection not found"));
        }
    }
} 