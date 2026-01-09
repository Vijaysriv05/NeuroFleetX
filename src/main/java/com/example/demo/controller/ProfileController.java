/*package com.example.demo.controller;

import com.example.demo.entity.UserProfile;
import com.example.demo.repository.UserProfileRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/profile")
@CrossOrigin
public class ProfileController {

    @Autowired
    private UserProfileRepository repo;

    @GetMapping
    public UserProfile getProfile(@RequestParam String email) {
        return repo.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Profile not found"));
    }

    @PostMapping
    public UserProfile createProfile(@RequestBody UserProfile profile) {
        return repo.save(profile);
    }

    @PutMapping
    public UserProfile updateProfile(@RequestBody UserProfile profile) {
        return repo.save(profile);
    }
}*/

