package com.example.demo;

import com.example.demo.entity.User;
import com.example.demo.entity.UserProfile;
import com.example.demo.repository.UserRepository;
import com.example.demo.repository.UserProfileRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class ProfileInitializer implements CommandLineRunner {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private UserProfileRepository userProfileRepository;

    @Override
    public void run(String... args) throws Exception {
        List<User> users = userRepository.findAll();

        for (User user : users) {
            if (!userProfileRepository.findByEmail(user.getEmail()).isPresent()) {
                UserProfile profile = new UserProfile();
                profile.setName(user.getUsername());
                profile.setEmail(user.getEmail());
                profile.setRoleId(user.getRoleId());
                userProfileRepository.save(profile);
            }
        }

        System.out.println("Existing user profiles initialized!");
    }
}

