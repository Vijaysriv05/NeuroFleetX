package com.example.demo.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/customer/dashboard")
@CrossOrigin(origins = "http://localhost:3000", allowCredentials = "true")
public class CustomerDashboardController {

    @GetMapping
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<String> customerDashboard() {
        return ResponseEntity.ok("Customer dashboard loaded successfully");
    }
}



