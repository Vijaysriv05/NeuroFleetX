package com.example.demo.controller;

import org.springframework.security.core.Authentication;

import com.example.demo.entity.User;
import com.example.demo.entity.UserProfile;
import com.example.demo.repository.UserRepository;
import com.example.demo.repository.UserProfileRepository;
import com.example.demo.config.JwtUtil;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.HashMap;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "http://localhost:3000")
public class AuthController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private UserProfileRepository userProfileRepository; // ✅ Added

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtil jwtUtil;

    // -------- REGISTER --------
    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody User user) {

        StringBuilder errors = new StringBuilder();

        // Validations
        if (user.getUsername() == null || user.getUsername().trim().isEmpty()) {
            errors.append("Username is required, ");
        }

        if (user.getEmail() == null || user.getEmail().trim().isEmpty()) {
            errors.append("Email is required, ");
        } else if (!user.getEmail().matches("^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.(com|org|net|in)$")) {
            errors.append("Invalid email format, ");
        }

        if (user.getPassword() == null || user.getPassword().isEmpty()) {
            errors.append("Password is required, ");
        } else if (user.getPassword().length() < 8) {
            errors.append("Password must be at least 8 characters, ");
        }

        // Role Validation
        List<Integer> validRoles = List.of(1, 2, 3, 4);
        if (user.getRoleId() == null) {
            errors.append("Please select a role, ");
        } else if (!validRoles.contains(user.getRoleId())) {
            errors.append("Invalid role selected, ");
        }

        // Return error response
        if (errors.length() > 0) {
            return ResponseEntity.badRequest()
                    .body(Map.of(
                            "message", errors.substring(0, errors.length() - 2),
                            "status", "error"
                    ));
        }

        // Check existing user
        if (userRepository.findByEmail(user.getEmail()).isPresent()) {
            return ResponseEntity.badRequest().body(Map.of(
                    "message", "User already exists. Please login.",
                    "status", "error"
            ));
        }

        // Save user
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        userRepository.save(user);

        // -------- CREATE PROFILE IMMEDIATELY --------
        UserProfile profile = new UserProfile();
        profile.setName(user.getUsername());
        profile.setEmail(user.getEmail());
        profile.setRoleId(user.getRoleId()); // Assuming getRole() returns correct Role enum
        userProfileRepository.save(profile);

        return ResponseEntity.ok(Map.of(
                "message", "Registered successfully",
                "status", "success"
        ));
    }

    // -------- LOGIN --------
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody User loginRequest) {

        StringBuilder errors = new StringBuilder();

        if (loginRequest.getEmail() == null || loginRequest.getEmail().trim().isEmpty()) {
            errors.append("Email is required, ");
        } else if (!loginRequest.getEmail().matches("^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.(com|org|net|in)$")) {
            errors.append("Invalid email format, ");
        }

        if (loginRequest.getPassword() == null || loginRequest.getPassword().isEmpty()) {
            errors.append("Please enter password, ");
        }

        // Role Validation
        List<Integer> validRoles = List.of(1, 2, 3, 4);
        if (loginRequest.getRoleId() == null) {
            errors.append("Please select a role, ");
        } else if (!validRoles.contains(loginRequest.getRoleId())) {
            errors.append("Invalid role selected, ");
        }

        if (errors.length() > 0) {
            return ResponseEntity.badRequest()
                    .body(Map.of(
                            "message", errors.substring(0, errors.length() - 2),
                            "status", "error"
                    ));
        }

        Optional<User> userOpt = userRepository.findByEmail(loginRequest.getEmail());

        if (userOpt.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of(
                    "message", "User not found",
                    "status", "error"
            ));
        }

        User user = userOpt.get();

        if (!passwordEncoder.matches(loginRequest.getPassword(), user.getPassword())) {
            return ResponseEntity.badRequest().body(Map.of(
                    "message", "Incorrect password",
                    "status", "error"
            ));
        }

        if (!user.getRoleId().equals(loginRequest.getRoleId())) {
            return ResponseEntity.badRequest().body(Map.of(
                    "message", "Invalid role for this user",
                    "status", "error"
            ));
        }

        String token = jwtUtil.generateToken(user.getEmail());

        return ResponseEntity.ok(
                Map.of(
                        "message", "Login successful",
                        "status", "success",
                        "token", token,
                        "roleId", user.getRoleId()
                )
        );
    }

    // -------- GET PROFILE --------
    @GetMapping("/profile")
    public ResponseEntity<?> profile(Authentication authentication) {
        String email = authentication.getName();

        UserProfile profile = userProfileRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Profile not found"));

        Map<String, Object> response = new HashMap<>();
        response.put("name", profile.getName());
        response.put("email", profile.getEmail());
        response.put("role", profile.getRoleId());
        response.put("phone", profile.getPhone());
        response.put("address", profile.getAddress());

        return ResponseEntity.ok(response);
    }

    // -------- UPDATE PROFILE --------
    @PutMapping("/profile")
    public ResponseEntity<?> updateProfile(
            @RequestHeader("Authorization") String authHeader,
            @RequestBody UserProfile updatedData) {

        try {
            String token = authHeader.replace("Bearer ", "");
            String email = jwtUtil.extractUsername(token);

            UserProfile profile = userProfileRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("Profile not found"));

            profile.setName(updatedData.getName());
            profile.setPhone(updatedData.getPhone());
            profile.setAddress(updatedData.getAddress());

            userProfileRepository.save(profile);

            return ResponseEntity.ok("Profile updated successfully");
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Failed to update profile");
        }
    }

    // -------- GET ALL USERS --------
    @GetMapping("/users")
    public ResponseEntity<?> getAllUsers() {
        return ResponseEntity.ok(userRepository.findAll());
    }

    // -------- PING --------
    @GetMapping("/ping")
    public ResponseEntity<String> ping() {
        return ResponseEntity.ok("Pong ✅");
    }
}





