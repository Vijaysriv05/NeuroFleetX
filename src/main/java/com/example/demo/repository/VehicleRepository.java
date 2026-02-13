package com.example.demo.repository;

import com.example.demo.entity.Vehicle;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
// CHANGE: Set ID type to Long
public interface VehicleRepository extends JpaRepository<Vehicle, Long> {

    // CHANGE: Parameter set to Long
    Optional<Vehicle> findById(Long id);

    long countByStatus(String status);

    @Query("SELECT COUNT(v) FROM Vehicle v WHERE v.status = 'IN_USE' OR v.status = 'IN USE'")
    long countTotalActiveDeploy();

    @Query("SELECT v FROM Vehicle v WHERE v.location = :location AND v.status = :status")
    List<Vehicle> findTopNByLocationAndStatus(
            @Param("location") String location,
            @Param("status") String status,
            Pageable pageable
    );

    List<Vehicle> findByModelContainingIgnoreCase(String model);
}