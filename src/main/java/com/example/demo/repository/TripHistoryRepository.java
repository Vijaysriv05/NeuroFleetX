package com.example.demo.repository;

import com.example.demo.entity.TripHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface TripHistoryRepository extends JpaRepository<TripHistory, Long> {
    // Fetches history for a specific driver, newest first
    List<TripHistory> findByUserIdOrderByCompletedAtDesc(String userId);
}