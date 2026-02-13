package com.example.demo.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/manager/dashboard")
@CrossOrigin(origins = "http://localhost:3000", allowCredentials = "true")
public class ManagerDashboardController {

    @GetMapping
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<String> managerDashboard() {
        return ResponseEntity.ok("Manager dashboard loaded successfully");
    }
}




