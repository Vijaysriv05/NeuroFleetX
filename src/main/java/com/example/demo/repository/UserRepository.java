package com.example.demo.repository;

import com.example.demo.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.List;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    // Used for Login and Registration checks
    Optional<User> findByEmail(String email);

    // Used for Admin Dashboard filtering (Pending/Approved/Rejected)
    // This matches the 'role' field in your User.java entity
    List<User> findByRole(String role);

    // If your AuthController uses findByUsername (common in many auth setups),
    // add it here to prevent compilation errors
    Optional<User> findByUsername(String username);
}