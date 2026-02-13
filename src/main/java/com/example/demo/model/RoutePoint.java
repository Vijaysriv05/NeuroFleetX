package com.example.demo.model;

public class RoutePoint {
    private double lat;
    private double lng;

    public RoutePoint(double lat, double lng) {
        this.lat = lat;
        this.lng = lng;
    }

    // Getters and Setters
    public double getLat() { return lat; }
    public void setLat(double lat) { this.lat = lat; }
    public double getLng() { return lng; }
    public void setLng(double lng) { this.lng = lng; }
}