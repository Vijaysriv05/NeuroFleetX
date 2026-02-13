package com.example.demo.repository;

import com.example.demo.entity.Feedback;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface FeedbackRepository extends JpaRepository<Feedback, Long> {

    /**
     * Fetches all user feedback, sorting by the latest 'timestamp' field.
     */
    List<Feedback> findAllByOrderByTimestampDesc();
}