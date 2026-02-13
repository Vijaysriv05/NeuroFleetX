package com.example.demo.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "customer_vehicles")
public class CustomerVehicle {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long userId;
    private Long vehicleId;
    private String vehicleModel;
    private String status; // e.g., "pending", "approved", "pickup_completed", "dropped"
    private String operatorName;
    private String maintenanceIssue;

    // --- TELEMETRY FIELDS (Required by TelemetrySimulator) ---
    private Double fuel;
    private Double speed;
    private Double tirePressure;
    private String vehicleCondition;

    // Default Constructor
    public CustomerVehicle() {}

    // --- GETTERS AND SETTERS ---

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public Long getVehicleId() { return vehicleId; }
    public void setVehicleId(Long vehicleId) { this.vehicleId = vehicleId; }

    public String getVehicleModel() { return vehicleModel; }
    public void setVehicleModel(String vehicleModel) { this.vehicleModel = vehicleModel; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getOperatorName() { return operatorName; }
    public void setOperatorName(String operatorName) { this.operatorName = operatorName; }

    public String getMaintenanceIssue() { return maintenanceIssue; }
    public void setMaintenanceIssue(String maintenanceIssue) { this.maintenanceIssue = maintenanceIssue; }

    public Double getFuel() { return fuel; }
    public void setFuel(Double fuel) { this.fuel = fuel; }

    public Double getSpeed() { return speed; }
    public void setSpeed(Double speed) { this.speed = speed; }

    public Double getTirePressure() { return tirePressure; }
    public void setTirePressure(Double tirePressure) { this.tirePressure = tirePressure; }

    public String getVehicleCondition() { return vehicleCondition; }
    public void setVehicleCondition(String vehicleCondition) { this.vehicleCondition = vehicleCondition; }
}