package com.example.demo.repository;

import com.example.demo.entity.MaintenanceLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface MaintenanceLogRepository extends JpaRepository<MaintenanceLog, Long> {
    // This allows the driver to see their specific logs
    List<MaintenanceLog> findByUserId(Long userId);

    // This allows the manager to see history sorted by time
    List<MaintenanceLog> findAllByOrderByServiceTimestampDesc();
}