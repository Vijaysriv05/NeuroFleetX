package com.example.demo.repository;

import com.example.demo.entity.UserProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserProfileRepository extends JpaRepository<UserProfile, Long> {

    // Required for the /api/profile endpoint
    Optional<UserProfile> findByEmail(String email);

    // Required for filtering by status (PENDING, REJECTED, etc.)
    List<UserProfile> findByStatus(String status);
}