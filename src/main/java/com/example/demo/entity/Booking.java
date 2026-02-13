package com.example.demo.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "booking")
public class Booking {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id")
    private String userId;

    @Column(name = "vehicle_model")
    private String vehicleModel;

    @Column(name = "status")
    private String status; // PENDING, APPROVED, TRIP_ACTIVE, REJECTED

    @Column(name = "pickup_location")
    private String pickupLocation;

    @Column(name = "drop_location")
    private String dropLocation;

    @Column(name = "booking_time")
    private LocalDateTime bookingTime = LocalDateTime.now();

    // --- DASHBOARD METRICS (NEUROX UI COMPATIBLE) ---

    @Column(name = "distance")
    private String distance = "0.00";

    @Column(name = "duration")
    private String duration = "0.0";

    @Column(name = "progress")
    private Integer progress = 0;

    @Column(name = "velocity")
    private String velocity = "0"; // To display "0 KM/H" on UI

    @Column(name = "energy")
    private Integer energy = 100; // To display "100%" on UI

    // --- CONSTRUCTORS ---

    public Booking() {}

    // --- EXISTING GETTERS AND SETTERS ---

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public String getVehicleModel() { return vehicleModel; }
    public void setVehicleModel(String vehicleModel) { this.vehicleModel = vehicleModel; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getPickupLocation() { return pickupLocation; }
    public void setPickupLocation(String pickupLocation) { this.pickupLocation = pickupLocation; }

    public String getDropLocation() { return dropLocation; }
    public void setDropLocation(String dropLocation) { this.dropLocation = dropLocation; }

    public LocalDateTime getBookingTime() { return bookingTime; }
    public void setBookingTime(LocalDateTime bookingTime) { this.bookingTime = bookingTime; }

    // --- NEW METRIC GETTERS AND SETTERS ---

    public String getDistance() { return distance; }
    public void setDistance(String distance) { this.distance = distance; }

    public String getDuration() { return duration; }
    public void setDuration(String duration) { this.duration = duration; }

    public Integer getProgress() { return progress; }
    public void setProgress(Integer progress) { this.progress = progress; }

    public String getVelocity() { return velocity; }
    public void setVelocity(String velocity) { this.velocity = velocity; }

    public Integer getEnergy() { return energy; }
    public void setEnergy(Integer energy) { this.energy = energy; }
}