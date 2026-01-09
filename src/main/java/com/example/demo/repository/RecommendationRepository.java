package com.example.demo.repository;

import com.example.demo.entity.Recommendation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RecommendationRepository extends JpaRepository<Recommendation, Integer> {

    // This will now work because 'type' exists in Recommendation
    List<Recommendation> findByType(String type);
}


