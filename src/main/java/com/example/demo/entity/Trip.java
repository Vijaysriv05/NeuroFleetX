package com.example.demo.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDateTime;

@Entity
@Table(name = "trips")
public class Trip {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer tripId;

    private Integer bookingId;

    @Column(length = 50)
    private String tripStatus; // e.g., Started, Completed

    private Double tripDistance;

    @Column(name = "created_at", nullable = false, updatable = false)
    @CreationTimestamp
    private LocalDateTime createdAt;

    // -------- Getters --------
    public Integer getTripId() { return tripId; }
    public Integer getBookingId() { return bookingId; }
    public String getTripStatus() { return tripStatus; }
    public Double getTripDistance() { return tripDistance; }
    public LocalDateTime getCreatedAt() { return createdAt; }

    // -------- Setters --------
    public void setTripId(Integer tripId) { this.tripId = tripId; }
    public void setBookingId(Integer bookingId) { this.bookingId = bookingId; }
    public void setTripStatus(String tripStatus) { this.tripStatus = tripStatus; }
    public void setTripDistance(Double tripDistance) { this.tripDistance = tripDistance; }
}

