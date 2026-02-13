package com.example.demo.model;
import java.util.List;

public class RouteResponse {
    private List<double[]> coordinates; // [lat, lng] for map polyline
    private double totalDistance;
    private double estimatedTime;
    private String suggestion;

    // Getters and Setters
    public List<double[]> getCoordinates() { return coordinates; }
    public void setCoordinates(List<double[]> coordinates) { this.coordinates = coordinates; }
    public double getTotalDistance() { return totalDistance; }
    public void setTotalDistance(double totalDistance) { this.totalDistance = totalDistance; }
    public double getEstimatedTime() { return estimatedTime; }
    public void setEstimatedTime(double estimatedTime) { this.estimatedTime = estimatedTime; }
    public String getSuggestion() { return suggestion; }
    public void setSuggestion(String suggestion) { this.suggestion = suggestion; }
}