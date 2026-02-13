/*package com.example.demo.controller;

import com.example.demo.entity.Maintenance;
import com.example.demo.repository.MaintenanceRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;
import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/driver")
@CrossOrigin(origins = "http://localhost:3000") // Restricts access to your React app for better security
public class DriverOperationController {

    @Autowired
    private MaintenanceRepository maintenanceRepo;

    @PostMapping("/maintenance/{userId}")
    public ResponseEntity<?> reportMaintenance(@PathVariable String userId, @RequestBody Map<String, String> payload) {
        try {
            // Force numeric ID extraction
            Long cleanId = Long.parseLong(userId.replaceAll("[^0-9]", ""));

            Maintenance report = new Maintenance();
            report.setUserId(cleanId);
            report.setDescription(payload.get("description"));
            report.setStatus("PENDING");
            report.setCreatedAt(LocalDateTime.now()); // Now this will work!

            maintenanceRepo.save(report);

            return ResponseEntity.ok(Map.of("message", "SUCCESS: LOG_TRANSMITTED"));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("SERVER_ERROR: " + e.getMessage());
        }
    }
    @PostMapping("/emergency/{userId}")
    public ResponseEntity<?> triggerEmergency(@PathVariable Long userId) {
        return ResponseEntity.ok(Map.of("status", "SOS_ALARM_SENT"));
    }
}*/