package com.example.demo.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.Map;
import java.util.HashMap;

@RestController
@RequestMapping("/api/driver")
@CrossOrigin(origins = "http://localhost:3000", allowCredentials = "true")
public class DriverDashboardController {

    /**
     * DASHBOARD DATA LOAD
     * Path: GET /api/driver/dashboard
     */
    @GetMapping("/dashboard")
    @PreAuthorize("hasRole('DRIVER')")
    public ResponseEntity<String> getDashboard() {
        return ResponseEntity.ok("CORE_CONNECTED");
    }

    /**
     * SOS SIGNAL HANDLER
     * Path: POST /api/driver/emergency/12
     */
    @PostMapping("/emergency/{id}")
    @PreAuthorize("hasRole('DRIVER')")
    public ResponseEntity<?> triggerSOS(@PathVariable Long id) {
        try {
            // Logs to your IntelliJ Console so you can see it working
            System.out.println(">>> SOS SIGNAL RECEIVED FROM DRIVER ID: " + id);

            Map<String, Object> response = new HashMap<>();
            response.put("message", "SOS_BROADCAST_SENT");
            response.put("driverId", id);
            response.put("status", "ACTIVE_ALERT");

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            e.printStackTrace(); // This shows the error in IntelliJ
            return ResponseEntity.status(500).body("Internal SOS Error: " + e.getMessage());
        }
    }

    /**
     * MAINTENANCE REPORT HANDLER
     * Path: POST /api/driver/maintenance/12
     */
    @PostMapping("/maintenance/{id}")
    @PreAuthorize("hasRole('DRIVER')")
    public ResponseEntity<?> reportMaintenance(@PathVariable Long id, @RequestBody Map<String, String> payload) {
        try {
            String issue = payload.get("issue");
            System.out.println(">>> MAINTENANCE LOG: Driver " + id + " reported: " + issue);

            Map<String, Object> response = new HashMap<>();
            response.put("message", "MAINTENANCE_LOGGED");
            response.put("details", issue);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("Internal Maintenance Error: " + e.getMessage());
        }
    }
}