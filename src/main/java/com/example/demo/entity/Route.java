package com.example.demo.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDateTime;

@Entity
@Table(name = "routes")
public class Route {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer routeId;

    @Column(nullable = false, length = 100)
    private String source;

    @Column(nullable = false, length = 100)
    private String destination;

    private Double distance; // in km

    @Column(name = "created_at", nullable = false, updatable = false)
    @CreationTimestamp
    private LocalDateTime createdAt;

    // -------- Getters --------
    public Integer getRouteId() { return routeId; }
    public String getSource() { return source; }
    public String getDestination() { return destination; }
    public Double getDistance() { return distance; }
    public LocalDateTime getCreatedAt() { return createdAt; }

    // -------- Setters --------
    public void setRouteId(Integer routeId) { this.routeId = routeId; }
    public void setSource(String source) { this.source = source; }
    public void setDestination(String destination) { this.destination = destination; }
    public void setDistance(Double distance) { this.distance = distance; }
}

