package com.example.ai_companion.controller;

import com.example.ai_companion.model.GameMessage;
import com.example.ai_companion.model.GameSession;
import com.example.ai_companion.service.GameService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Controller for handling cognitive game operations.
 */
@RestController
@RequestMapping("/games")
public class GameController {

    @Autowired
    private GameService gameService;

    /**
     * Generates a game preview without creating a session.
     */
    @PostMapping("/preview")
    public ResponseEntity<Map<String, String>> generateGamePreview(@RequestParam String userId) {
        Map<String, String> preview = gameService.generateGamePreview(userId);
        return ResponseEntity.ok(preview);
    }

    /**
     * Creates a new game session.
     */
    @PostMapping("/create")
    public ResponseEntity<GameSession> createGameSession(
            @RequestParam String userId,
            @RequestBody Map<String, String> payload) {
        
        String gameType = payload.get("gameType"); // "generated" or "custom"
        String userDescription = payload.get("userDescription");
        
        GameSession gameSession = gameService.createGameSession(userId, gameType, userDescription);
        return ResponseEntity.ok(gameSession);
    }

    /**
     * Gets all game sessions for a user.
     */
    @GetMapping("/sessions")
    public ResponseEntity<List<GameSession>> getUserGameSessions(@RequestParam String userId) {
        List<GameSession> sessions = gameService.getUserGameSessions(userId);
        return ResponseEntity.ok(sessions);
    }

    /**
     * Gets a specific game session.
     */
    @GetMapping("/sessions/{sessionId}")
    public ResponseEntity<GameSession> getGameSession(@PathVariable String sessionId) {
        GameSession session = gameService.getGameSession(sessionId);
        if (session != null) {
            return ResponseEntity.ok(session);
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Sends a message in a game session and gets AI response.
     */
    @PostMapping("/sessions/{sessionId}/message")
    public ResponseEntity<String> sendGameMessage(
            @PathVariable String sessionId,
            @RequestParam String userId,
            @RequestBody Map<String, String> payload) {
        
        String message = payload.get("message");
        String response = gameService.processGameMessage(sessionId, userId, message);
        return ResponseEntity.ok(response);
    }

    /**
     * Gets messages for a game session with pagination.
     */
    @GetMapping("/sessions/{sessionId}/messages")
    public ResponseEntity<List<GameMessage>> getGameMessages(
            @PathVariable String sessionId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        
        List<GameMessage> messages = gameService.getGameMessages(sessionId, page, size);
        return ResponseEntity.ok(messages);
    }

    /**
     * Deletes a game session and all its messages.
     */
    @DeleteMapping("/sessions/{sessionId}")
    public ResponseEntity<Void> deleteGameSession(@PathVariable String sessionId) {
        gameService.deleteGameSession(sessionId);
        return ResponseEntity.noContent().build();
    }
} 