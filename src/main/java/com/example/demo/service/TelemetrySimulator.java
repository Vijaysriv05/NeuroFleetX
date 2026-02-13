package com.example.demo.service;

import com.example.demo.entity.CustomerVehicle;
import com.example.demo.repository.CustomerVehicleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Random;

@Service
public class TelemetrySimulator {

    @Autowired
    private CustomerVehicleRepository repository;

    private final Random random = new Random();

    /**
     * Updates approved vehicles every 5 seconds.
     * Generates random speed, drains fuel, and calculates vehicle condition.
     */
    @Scheduled(fixedRate = 5000)
    public void simulateTelemetry() {
        try {
            // FIXED: Fetching by string status "approved" to avoid "cannot find symbol" error
            // This assumes your repository has a findByStatus(String status) method
            List<CustomerVehicle> approvedVehicles = repository.findByStatus("approved");

            if (approvedVehicles == null || approvedVehicles.isEmpty()) {
                return; // No active units to simulate
            }

            for (CustomerVehicle v : approvedVehicles) {
                // 1. Generate core telemetry data
                double currentSpeed = random.nextDouble() * 120.0;

                // Fetch current fuel or default to 100.0, then drain
                double existingFuel = (v.getFuel() != null) ? v.getFuel() : 100.0;
                double currentFuel = Math.max(0, existingFuel - 0.1);

                // Random tire pressure between 28.0 and 36.0 PSI
                double currentTire = 28.0 + (random.nextDouble() * 8.0);

                // 2. Set values to the entity
                v.setSpeed(currentSpeed);
                v.setFuel(currentFuel);
                v.setTirePressure(currentTire);

                // 3. --- ADVANCED CONDITION LOGIC ---
                if (currentFuel < 5) {
                    v.setVehicleCondition("CRITICAL_FUEL_LEVEL");
                } else if (currentTire < 30) {
                    v.setVehicleCondition("LOW_TIRE_PRESSURE");
                } else if (currentTire > 35) {
                    v.setVehicleCondition("OVER_INFLATED_TIRES");
                } else if (currentSpeed > 100) {
                    v.setVehicleCondition("HIGH_SPEED_ALERT");
                } else if (currentFuel < 15) {
                    v.setVehicleCondition("LOW_FUEL_RESERVE");
                } else {
                    v.setVehicleCondition("OPTIMAL");
                }

                // 4. Save updated telemetry back to database
                repository.save(v);
            }
            System.out.println(">>> Telemetry Sync: " + approvedVehicles.size() + " units updated with advanced logic.");
        } catch (Exception e) {
            System.err.println("Telemetry Simulation Error: " + e.getMessage());
        }
    }
}