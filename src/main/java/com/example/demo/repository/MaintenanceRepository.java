package com.example.demo.repository;

import com.example.demo.entity.Maintenance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository

public interface MaintenanceRepository extends JpaRepository<Maintenance, Long> {
}