package com.example.ai_companion.controller;

import com.example.ai_companion.model.Reminder;
import com.example.ai_companion.repository.ReminderRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.*;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * REST controller for managing reminders.
 */
@RestController
@RequestMapping("/reminders")
public class ReminderController {

    @Autowired
    private ReminderRepository reminderRepository;

    /**
     * Create a new reminder.
     *
     * @param reminder The reminder object from the request body.
     * @return The saved reminder.
     */
    @PostMapping
    public ResponseEntity<Reminder> createReminder(@RequestBody Reminder reminder) {
        Reminder saved = reminderRepository.save(reminder);
        return ResponseEntity.ok(saved);
    }

    /**
     * Retrieve 10 reminders per page for a given user, ordered by timestamp (ascending).
     *
     * @param userId The ID of the user.
     * @param page   The page number (default is 0).
     * @return A paginated response with reminders, hasMore, and currentPage.
     */
    @GetMapping
    public ResponseEntity<Map<String, Object>> getReminders(
            @RequestParam String userId,
            @RequestParam(defaultValue = "0") int page) {

        Pageable pageable = PageRequest.of(page, 10, Sort.by("timestamp").ascending());
        Page<Reminder> reminderPage = reminderRepository.findByUserId(userId, pageable);
        
        Map<String, Object> response = new HashMap<>();
        response.put("reminders", reminderPage.getContent());
        response.put("hasMore", reminderPage.hasNext());
        response.put("currentPage", page);
        
        return ResponseEntity.ok(response);
    }

    /**
     * Update a specific reminder.
     *
     * @param id       The reminder ID.
     * @param updates  The fields to update (partial or full).
     * @return The updated reminder or 404 if not found.
     */
    @PutMapping("/{id}")
    public ResponseEntity<Reminder> updateReminder(
            @PathVariable String id,
            @RequestBody Reminder updates) {

        Optional<Reminder> optional = reminderRepository.findById(id);
        if (optional.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Reminder existing = optional.get();

        // Only update fields that are provided (not null)
        if (updates.getTitle() != null) existing.updateTitle(updates.getTitle());
        if (updates.getTimestamp() != null) existing.updateTimestamp(updates.getTimestamp());
        if (updates.getDescription() != null) existing.updateDescription(updates.getDescription());
        if (updates.getTags() != null) existing.updateTags(updates.getTags());
        if (updates.getStatus() != null) existing.updateStatus(updates.getStatus());

        Reminder saved = reminderRepository.save(existing);
        return ResponseEntity.ok(saved);
    }

    /**
     * Delete a reminder by ID.
     *
     * @param id The reminder ID.
     * @return HTTP 204 if deleted, or 404 if not found.
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteReminder(@PathVariable String id) {
        if (!reminderRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        reminderRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}