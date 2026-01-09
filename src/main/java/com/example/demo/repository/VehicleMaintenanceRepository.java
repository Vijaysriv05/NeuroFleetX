package com.example.demo.repository;

import com.example.demo.entity.VehicleMaintenance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface VehicleMaintenanceRepository extends JpaRepository<VehicleMaintenance, Integer> {
    List<VehicleMaintenance> findByVehicleId(int vehicleId);
}
