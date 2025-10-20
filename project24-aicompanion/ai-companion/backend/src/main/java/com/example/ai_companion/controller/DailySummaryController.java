
package com.example.ai_companion.controller;

import com.example.ai_companion.model.DailySummary;
import com.example.ai_companion.service.DailySummaryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/daily-summaries")
@CrossOrigin(origins = "*")
public class DailySummaryController {

    @Autowired
    private DailySummaryService dailySummaryService;

    @GetMapping("/{userId}")
    public ResponseEntity<List<DailySummary>> getUserDailySummaries(@PathVariable String userId) {
        try {
            List<DailySummary> summaries = dailySummaryService.getUserDailySummaries(userId);
            return ResponseEntity.ok(summaries);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/{userId}/{date}")
    public ResponseEntity<DailySummary> getDailySummary(
            @PathVariable String userId,
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        try {
            DailySummary summary = dailySummaryService.getDailySummary(userId, date);
            if (summary != null) {
                return ResponseEntity.ok(summary);
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @PostMapping("/{userId}/generate")
    public ResponseEntity<?> generateDailySummary(
            @PathVariable String userId,
            @RequestBody Map<String, Object> request) {
        try {
            String dateString = (String) request.get("date");
            int timezoneOffsetMinutes = ((Number) request.get("timezoneOffsetMinutes")).intValue();
            LocalDate date = LocalDate.parse(dateString);
            ZoneOffset userOffset = ZoneOffset.ofTotalSeconds(timezoneOffsetMinutes * 60);
            return ResponseEntity.ok(dailySummaryService.generateDailySummary(userId, date, userOffset));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Failed to generate daily summary: " + e.getMessage());
        }
    }

    @GetMapping("/{userId}/can-generate/{date}")
    public ResponseEntity<Map<String, Object>> canGenerateSummary(
            @PathVariable String userId,
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam int timezoneOffsetMinutes) {
        ZoneOffset userOffset = ZoneOffset.ofTotalSeconds(timezoneOffsetMinutes * 60);
        boolean canGenerate = dailySummaryService.canGenerateSummary(userId, date, userOffset);
        boolean exists = dailySummaryService.dailySummaryExists(userId, date);
        Map<String, Object> response = new HashMap<>();
        response.put("canGenerate", canGenerate);
        response.put("exists", exists);
        response.put("date", date.toString());
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{userId}/{date}")
    public ResponseEntity<?> deleteDailySummary(
            @PathVariable String userId,
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        try {
            dailySummaryService.deleteDailySummary(userId, date);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            Map<String, String> response = new HashMap<>();
            response.put("error", "Failed to delete daily summary: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }
} 