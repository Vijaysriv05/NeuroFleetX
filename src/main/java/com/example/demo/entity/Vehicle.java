package com.example.demo.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDateTime;

@Entity
@Table(name = "vehicles")
public class Vehicle {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String model;

    @Column(nullable = false)
    private String status;

    private String location;

    @Column(name = "sector")
    private String sector;

    private Integer fuel;

    // Field is Double
    private Double speed;

    private Integer seats;
    private Double price;

    @Column(name = "vehicle_condition")
    private String vehicleCondition;

    @Column(name = "tire_pressure")
    private Double tirePressure;

    @Column(name = "total_distance")
    private Double totalDistance;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    // --- GETTERS AND SETTERS ---
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getModel() { return model; }
    public void setModel(String model) { this.model = model; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }

    public String getSector() { return sector; }
    public void setSector(String sector) { this.sector = sector; }

    public Integer getFuel() { return fuel; }
    public void setFuel(Integer fuel) { this.fuel = fuel; }

    // FIXED: Changed return type to Double to match field
    public Double getSpeed() { return speed; }

    // FIXED: Changed parameter type to Double to match field
    public void setSpeed(Double speed) { this.speed = speed; }

    public Integer getSeats() { return seats; }
    public void setSeats(Integer seats) { this.seats = seats; }

    public Double getPrice() { return price; }
    public void setPrice(Double price) { this.price = price; }

    public String getVehicleCondition() { return vehicleCondition; }
    public void setVehicleCondition(String vehicleCondition) { this.vehicleCondition = vehicleCondition; }

    public Double getTirePressure() { return tirePressure; }
    public void setTirePressure(Double tirePressure) { this.tirePressure = tirePressure; }

    public Double getTotalDistance() { return totalDistance; }
    public void setTotalDistance(Double totalDistance) { this.totalDistance = totalDistance; }

    public LocalDateTime getCreatedAt() { return createdAt; }
}