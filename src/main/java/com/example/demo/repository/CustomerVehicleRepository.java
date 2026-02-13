package com.example.demo.repository;

import com.example.demo.entity.CustomerVehicle;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface CustomerVehicleRepository extends JpaRepository<CustomerVehicle, Long> {
    List<CustomerVehicle> findByUserId(Long userId);
    // Add this line to fix the compilation error
    List<CustomerVehicle> findByStatus(String status);
}